import { CheckCircle2, Crown, Wallet } from "lucide-react-native";
import { ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { useThemeStore } from "../../hooks/useThemeStore";

type PlanCard = {
  id: string;
  name: string;
  period: string;
  originalPrice: string | null;
  discountedPrice: string;
  discountLabel?: string;
  isCurrent?: boolean;
  label?: string;
  accent: string;
  accentSoft: string;
};

const getPlanCards = (colors: any): PlanCard[] => [
  {
    id: "free",
    name: "Free",
    period: "Starter plan",
    originalPrice: null,
    discountedPrice: "Rs 0",
    accent: colors.success,
    accentSoft: colors.successSoft,
  },
  {
    id: "paid",
    name: "Paid",
    period: "Custom plan",
    originalPrice: null,
    discountedPrice: "Contact support",
    label: "CUSTOM",
    accent: colors.warning,
    accentSoft: colors.warningSoft,
  },
];

const parsePriceValue = (value: string | null) => {
  if (!value) return 0;
  const digits = value.replace(/[^0-9]/g, "");
  return Number(digits || 0);
};

export default function PlansPricingScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { user } = useAuth();

  const planStatus = user?.plan_status || "free";
  const isLimited = user?.plan_is_limited ?? true;
  const planLimits = user?.plan_limits;
  const planUsage = user?.plan_usage;
  const planRemaining = user?.plan_remaining;

  const trialEndsAt = user?.plan_trial_ends_at ? new Date(user.plan_trial_ends_at) : null;
  const trialDaysLeft = user?.plan_trial_days_left ?? null;
  const trialLabel =
    planStatus === "trial" && trialEndsAt
      ? `Trial ends in ${trialDaysLeft ?? 0} day(s) • ${trialEndsAt.toDateString()}`
      : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View
          className="rounded-3xl border p-5 mb-5 overflow-hidden"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <View
            style={{
              position: "absolute",
              top: -40,
              right: -30,
              width: 140,
              height: 140,
              borderRadius: 999,
              backgroundColor: colors.warningSoft,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: -30,
              left: -20,
              width: 110,
              height: 110,
              borderRadius: 999,
              backgroundColor: colors.infoSoft,
            }}
          />

          <Text className="text-[24px] font-black mb-1" style={{ color: colors.foreground }}>
            Plans & Pricing
          </Text>
          <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
            Transparent plans with clear limits and flexible upgrades.
          </Text>

          <View
            className="self-start px-3 py-1 rounded-full"
            style={{ backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning }}
          >
            <Text className="text-[11px] font-extrabold" style={{ color: colors.warning }}>
              {planStatus === "paid" ? "PAID PLAN ACTIVE" : planStatus === "trial" ? "FREE TRIAL ACTIVE" : "FREE PLAN ACTIVE"}
            </Text>
          </View>
        </View>

        <View
          className="rounded-3xl border p-5 mb-5"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text className="text-base font-extrabold mb-2" style={{ color: colors.foreground }}>
            Your plan
          </Text>
          <Text className="text-sm mb-2" style={{ color: colors.mutedForeground }}>
            {planStatus === "paid"
              ? "Unlimited access with paid plan."
              : planStatus === "trial"
              ? "All features unlocked during trial."
              : "Free plan limits apply after trial."}
          </Text>
          {trialLabel ? (
            <Text className="text-xs font-semibold" style={{ color: colors.info }}>
              {trialLabel}
            </Text>
          ) : null}
        </View>

        {planLimits && planUsage ? (
          <View
            className="rounded-3xl border p-5 mb-5"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Text className="text-base font-extrabold mb-2" style={{ color: colors.foreground }}>
              Free plan limits
            </Text>
            <Text className="text-xs mb-3" style={{ color: colors.mutedForeground }}>
              {isLimited ? "Remaining counts shown below." : "Limits are paused during trial or paid plan."}
            </Text>

            <View className="gap-2">
              <Text className="text-sm" style={{ color: colors.foreground }}>
                Trucks: {planUsage.trucks}/{planLimits.trucks}
                {isLimited && planRemaining ? ` • ${planRemaining.trucks} left` : ""}
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                Drivers: {planUsage.drivers}/{planLimits.drivers}
                {isLimited && planRemaining ? ` • ${planRemaining.drivers} left` : ""}
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                Clients: {planUsage.clients}/{planLimits.clients}
                {isLimited && planRemaining ? ` • ${planRemaining.clients} left` : ""}
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                Bank verifications: {planUsage.bankVerifications}/{planLimits.bankVerifications}
                {isLimited && planRemaining ? ` • ${planRemaining.bankVerifications} left` : ""}
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                GST/PAN verifications: {planUsage.gstPanVerifications}/{planLimits.gstPanVerifications}
                {isLimited && planRemaining ? ` • ${planRemaining.gstPanVerifications} left` : ""}
              </Text>
              <Text className="text-sm" style={{ color: colors.foreground }}>
                RC verifications ({planUsage.rcYear}): {planUsage.rcVerificationsCurrentYear}/{planLimits.rcVerificationsPerYear}
                {isLimited && planRemaining ? ` • ${planRemaining.rcVerificationsCurrentYear} left` : ""}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="gap-3">
          {getPlanCards(colors).map((plan) => {
            const isCurrent =
              (plan.id === "free" && (planStatus === "free" || planStatus === "trial")) ||
              (plan.id === "paid" && planStatus === "paid");

            return (
            <View key={plan.id} className="rounded-3xl" style={{ backgroundColor: colors.background }}>
              <View
                className="rounded-3xl border p-4 overflow-hidden"
                style={{
                  backgroundColor: colors.card,
                  borderColor: isCurrent ? plan.accent : colors.border,
                  borderWidth: isCurrent ? 1.5 : 1,
                  shadowColor: plan.accent,
                  shadowOpacity: 0.16,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 4,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: -26,
                    right: -16,
                    width: 100,
                    height: 100,
                    borderRadius: 999,
                    backgroundColor: plan.accentSoft,
                  }}
                />

                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: plan.accentSoft }}
                    >
                      {plan.id === "free" ? (
                        <CheckCircle2 size={20} color={plan.accent} />
                      ) : plan.id === "paid" ? (
                        <Crown size={20} color={plan.accent} />
                      ) : (
                        <Wallet size={20} color={plan.accent} />
                      )}
                    </View>

                    <View>
                      <Text className="text-lg font-extrabold" style={{ color: colors.foreground }}>
                        {plan.name}
                      </Text>
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {plan.period}
                      </Text>
                    </View>
                  </View>

                  {isCurrent ? (
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: plan.accentSoft }}
                    >
                      <Text className="text-[10px] font-extrabold" style={{ color: plan.accent }}>
                        CURRENT
                      </Text>
                    </View>
                  ) : (
                    <View className="items-end">
                      <View
                        className="px-2 py-1 rounded-full mb-1"
                        style={{ backgroundColor: colors.destructiveSoft }}
                      >
                        <Text className="text-[10px] font-extrabold" style={{ color: colors.destructive }}>
                          {plan.discountLabel}
                        </Text>
                      </View>
                      {plan.label ? (
                        <Text className="text-[10px] font-black" style={{ color: plan.accent }}>
                          {plan.label}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>

                <View className="flex-row items-end gap-2 mb-3">
                  {plan.originalPrice ? (
                    <Text
                      className="text-sm"
                      style={{ color: colors.mutedForeground, textDecorationLine: "line-through" }}
                    >
                      {plan.originalPrice}
                    </Text>
                  ) : null}
                  <Text className="text-3xl font-black" style={{ color: colors.foreground }}>
                    {plan.discountedPrice}
                  </Text>
                </View>

                {!isCurrent ? (
                  <View
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: plan.accentSoft, borderWidth: 1, borderColor: plan.accent }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.foreground }}>
                      {plan.originalPrice
                        ? `You save Rs ${parsePriceValue(plan.originalPrice) - parsePriceValue(plan.discountedPrice)} on this plan`
                        : "Contact support to upgrade"}
                    </Text>
                  </View>
                ) : (
                  <View
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: plan.accentSoft, borderWidth: 1, borderColor: plan.accent }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.foreground }}>
                      {planStatus === "trial" ? "Trial access active" : "Plan access active"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )})}
        </View>

        <TouchableOpacity
          onPress={() => router.push("/(stack)/helpCenter" as any)}
          className="mt-6 rounded-2xl px-4 py-3 border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
        >
          <Text className="text-base font-extrabold" style={{ color: colors.foreground }}>
            Upgrade or contact support
          </Text>
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            Need higher limits? Tap here to reach support.
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
