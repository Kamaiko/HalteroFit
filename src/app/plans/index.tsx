/**
 * AllPlansScreen - Grid of all workout plans
 *
 * Placeholder for Task 2.1.3 implementation.
 *
 * @see docs/reference/jefit/screenshots/03-plans/01-all-plans.png
 */

import { ScreenContainer } from '@/components/layout';
import { Ionicons } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Colors, ICON_SIZE_3XL } from '@/constants';

export default function AllPlansScreen() {
  return (
    <ScreenContainer contentClassName="items-center justify-center p-6">
      <Ionicons name="layers-outline" size={ICON_SIZE_3XL} color={Colors.foreground.tertiary} />
      <Text className="text-xl font-bold text-foreground mt-4">All Plans</Text>
      <Text className="text-base text-foreground-secondary text-center mt-2">
        Plan selection grid will be implemented in Task 2.1.3
      </Text>
    </ScreenContainer>
  );
}
