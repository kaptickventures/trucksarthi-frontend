import { CheckCircle2, Crown, Wallet } from "lucide-react-native";
import { ScrollView, StatusBar, Text, View } from "react-native";

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
};

const PLAN_CARDS: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    period: "Current plan",
    originalPrice: null,
    discountedPrice: "Rs 0",
    isCurrent: true,
    accent: "#16A34A",
  },
  {
    id: "quarterly",
    name: "Quarterly",
    period: "per quarter",
    originalPrice: "Rs 2999",
    discountedPrice: "Rs 1499",
    discountLabel: "50% OFF",
    label: "HOT PICK",
    accent: "#0EA5E9",
  },
  {
    id: "yearly",
    name: "Yearly",
    period: "per year",
    originalPrice: "Rs 9999",
    discountedPrice: "Rs 4999",
    discountLabel: "50% OFF",
    label: "LUDICROUS DEAL",
    accent: "#F97316",
  },
];

const parsePriceValue = (value: string | null) => {
  if (!value) return 0;
  const digits = value.replace(/[^0-9]/g, "");
  return Number(digits || 0);
};

export default function PlansPricingScreen() {
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";

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
              backgroundColor: "#F9731622",
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
              backgroundColor: "#0EA5E922",
            }}
          />

          <Text className="text-[24px] font-black mb-1" style={{ color: colors.foreground }}>
            Plans & Pricing
          </Text>
          <Text className="text-sm mb-3" style={{ color: colors.mutedForeground }}>
            Clean pricing. Wild discounts. Limits can be added next.
          </Text>

          <View
            className="self-start px-3 py-1 rounded-full"
            style={{ backgroundColor: "#F59E0B22", borderWidth: 1, borderColor: "#F59E0B66" }}
          >
            <Text className="text-[11px] font-extrabold" style={{ color: "#D97706" }}>
              LIMITED OFFER: FLAT 50% OFF
            </Text>
          </View>
        </View>

        <View className="gap-3">
          {PLAN_CARDS.map((plan) => (
            <View key={plan.id} className="rounded-3xl" style={{ backgroundColor: colors.background }}>
              <View
                className="rounded-3xl border p-4 overflow-hidden"
                style={{
                  backgroundColor: colors.card,
                  borderColor: plan.id === "yearly" ? plan.accent : colors.border,
                  borderWidth: plan.id === "yearly" ? 1.5 : 1,
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
                    backgroundColor: `${plan.accent}20`,
                  }}
                />

                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${plan.accent}20` }}
                    >
                      {plan.id === "free" ? (
                        <CheckCircle2 size={20} color={plan.accent} />
                      ) : plan.id === "yearly" ? (
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

                  {plan.isCurrent ? (
                    <View
                      className="px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${plan.accent}25` }}
                    >
                      <Text className="text-[10px] font-extrabold" style={{ color: plan.accent }}>
                        CURRENT
                      </Text>
                    </View>
                  ) : (
                    <View className="items-end">
                      <View
                        className="px-2 py-1 rounded-full mb-1"
                        style={{ backgroundColor: "#EF444422" }}
                      >
                        <Text className="text-[10px] font-extrabold" style={{ color: "#EF4444" }}>
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

                {!plan.isCurrent ? (
                  <View
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: `${plan.accent}15`, borderWidth: 1, borderColor: `${plan.accent}40` }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.foreground }}>
                      You save Rs {parsePriceValue(plan.originalPrice) - parsePriceValue(plan.discountedPrice)} on this plan
                    </Text>
                  </View>
                ) : (
                  <View
                    className="rounded-xl px-3 py-2"
                    style={{ backgroundColor: `${plan.accent}15`, borderWidth: 1, borderColor: `${plan.accent}40` }}
                  >
                    <Text className="text-xs font-bold" style={{ color: colors.foreground }}>
                      Starter access active
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
