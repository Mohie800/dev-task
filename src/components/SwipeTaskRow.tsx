import { StyleSheet, Text, View, Pressable, Animated, type Animated as AnimatedNS } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { useTheme, spacing } from '@/theme';
import type { Task } from '@/db/types';
import { TaskRow } from './TaskRow';

/** Swipe actions per PRD §28: Start / Done / Postpone. */
export function SwipeTaskRow({
  task,
  onPress,
  onStart,
  onDone,
  onPostpone,
}: {
  task: Task;
  onPress?: () => void;
  onStart?: () => void;
  onDone?: () => void;
  onPostpone?: () => void;
}) {
  const { colors, type } = useTheme();
  const done = task.status === 'done';

  const renderActions = (progress: AnimatedNS.AnimatedInterpolation<number>) => {
    const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' });
    const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0], extrapolate: 'clamp' });
    return (
      <View style={styles.actions}>
        {!done && task.status !== 'in_progress' ? (
          <SwipeAction label="Start" color={colors.status.in_progress} opacity={opacity} translateX={translateX} onPress={onStart} />
        ) : null}
        {!done ? (
          <SwipeAction label="Done" color={colors.status.done} opacity={opacity} translateX={translateX} onPress={onDone} />
        ) : null}
        {!done ? (
          <SwipeAction label="Later" color={colors.status.todo} opacity={opacity} translateX={translateX} onPress={onPostpone} />
        ) : null}
      </View>
    );
  };

  return (
    <Swipeable friction={2} rightThreshold={40} renderRightActions={renderActions}>
      <TaskRow task={task} onPress={onPress} />
    </Swipeable>
  );
}

function SwipeAction({
  label,
  color,
  opacity,
  translateX,
  onPress,
}: {
  label: string;
  color: string;
  opacity: AnimatedNS.AnimatedInterpolation<number>;
  translateX: AnimatedNS.AnimatedInterpolation<number>;
  onPress?: () => void;
}) {
  const { type } = useTheme();
  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      <Pressable onPress={onPress} style={[styles.action, { backgroundColor: color }]}>
        <Text style={[type.footnote, { color: '#fff' }]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.sm },
  action: {
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: 10,
  },
});
