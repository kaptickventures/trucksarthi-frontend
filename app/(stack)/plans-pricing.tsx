import { CheckCircle2, Crown, Wallet } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StatusBar, Text, ToastAndroid, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import { useThemeStore } from "../../hooks/useThemeStore";
import API from "../api/axiosInstance";

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
  action?: "interest" | "none";
};

const getPlanCards = (colors: any, opts: { includeFree: boolean }): PlanCard[] => {
  const paid: PlanCard[] = [
    {
      id: "quarterly",
      name: "Quarterly",
      period: "3 months access",
      originalPrice: "₹ 2999",
      discountedPrice: "₹ 1499",
      discountLabel: "50% OFF",
      label: "BEST VALUE",
      accent: colors.info,
      accentSoft: colors.infoSoft,
      action: "interest",
    },
    {
      id: "yearly",
      name: "Yearly",
      period: "12 months access",
      originalPrice: "₹ 9999",
      discountedPrice: "₹ 4999",
      discountLabel: "50% OFF",
      accent: colors.primary,
      accentSoft: colors.successSoft,
      action: "interest",
    },
  ];

  if (!opts.includeFree) return paid;

  return [
    {
      id: "free",
      name: "Free",
      period: "Starter plan",
      originalPrice: null,
      discountedPrice: "₹ 0",
      accent: colors.success,
      accentSoft: colors.successSoft,
      action: "none",
    },
    ...paid,
  ];
};

export default function PlansPricingScreen() {
  const router = useRouter();
  const { colors, theme } = useThemeStore();
  const isDark = theme === "dark";
  const { user } = useAuth();
  const [requestingPlanId, setRequestingPlanId] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCard | null>(null);

  const rawPlanStatus = user?.plan_status || "free";

  const trialEndsAt = user?.plan_trial_ends_at ? new Date(user.plan_trial_ends_at) : null;
  const trialDaysLeft = user?.plan_trial_days_left ?? null;
  const trialExpired = rawPlanStatus === "trial" && trialEndsAt ? Date.now() > trialEndsAt.getTime() : false;

  // If trial ended but backend hasn't flipped the status yet, show Free plan.
  const planStatus = trialExpired ? "free" : rawPlanStatus;
  const trialLabel =
    planStatus === "trial" && trialEndsAt
      ? `Trial ends in ${trialDaysLeft ?? 0} day(s) | ${trialEndsAt.toDateString()}`
      : null;

  const showSavedToast = () => {
    const msg = "We have recorded your response";
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
      return;
    }
    Alert.alert("Saved", msg);
  };

  const saveInterestAndGoSupport = (plan: PlanCard, decision: "yes" | "no") => {
    if (requestingPlanId || !plan) return;
    (async () => {
      try {
        setRequestingPlanId(plan.id);
        await API.post("/api/plans/interest", {
          planId: plan.id,
          planName: plan.name,
          period: plan.period,
          originalPrice: plan.originalPrice,
          discountedPrice: plan.discountedPrice,
          decision,
        });
        showSavedToast();
        setConfirmVisible(false);
        setSelectedPlan(null);
        router.push("/(stack)/helpCenter" as any);
      } catch (err: any) {
        Alert.alert("Error", err?.response?.data?.error || "Failed to send request.");
      } finally {
        setRequestingPlanId(null);
      }
    })();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-3 px-0">
          <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>Plans & Pricing</Text>
        </View>

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

          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 }}>
            <Text className="text-base font-extrabold" style={{ color: colors.foreground }}>
              Your plan
            </Text>
            {planStatus === "trial" ? (
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warning }}
              >
                <Text className="text-[11px] font-extrabold" style={{ color: colors.warning }}>
                  FREE TRIAL
                </Text>
              </View>
            ) : null}
          </View>

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

	        <View className="gap-3">
	          {getPlanCards(colors, { includeFree: planStatus === "free" }).map((plan) => {
	            const isCurrent = plan.id === "free" ? planStatus === "free" : false;

	            return (
	            <View key={plan.id} className="rounded-3xl" style={{ backgroundColor: colors.background }}>
                <TouchableOpacity
                activeOpacity={0.9}
                disabled={isCurrent || requestingPlanId === plan.id}
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
                  opacity: requestingPlanId === plan.id ? 0.85 : 1,
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
                      {plan.discountLabel ? (
                        <View
                          className="px-2 py-1 rounded-full mb-1"
                          style={{ backgroundColor: colors.destructiveSoft }}
                        >
                          <Text className="text-[10px] font-extrabold" style={{ color: colors.destructive }}>
                            {plan.discountLabel}
                          </Text>
                        </View>
                      ) : null}
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

                {requestingPlanId === plan.id ? (
                  <View className="flex-row items-center" style={{ marginBottom: 10 }}>
                    <ActivityIndicator color={plan.accent} />
                    <Text className="ml-2 text-xs font-bold" style={{ color: colors.mutedForeground }}>
                      Sending request...
                    </Text>
                  </View>
                ) : null}

                {!isCurrent ? (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPlan(plan);
                      setConfirmVisible(true);
                    }}
                    disabled={requestingPlanId === plan.id}
                    className="rounded-xl px-3 py-3 items-center"
                    style={{ backgroundColor: plan.accent, opacity: requestingPlanId === plan.id ? 0.75 : 1 }}
                  >
                    <Text className="text-sm font-black" style={{ color: colors.primaryForeground }}>
                      Continue
                    </Text>
                  </TouchableOpacity>
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
              </TouchableOpacity>
            </View>
          )})}
        </View>

        <Modal
          transparent
          visible={confirmVisible}
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: colors.overlay45, justifyContent: "center", padding: 24 }}>
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 18,
              }}
            >
              <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "900", marginBottom: 10 }}>
                Confirm Plan
              </Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 14, lineHeight: 20 }}>
                {`Do you wish to continue with the ${selectedPlan?.name?.toLowerCase() || "selected"} plan?`}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  onPress={() => selectedPlan && saveInterestAndGoSupport(selectedPlan, "no")}
                  disabled={!!requestingPlanId}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.secondary,
                  }}
                >
                  <Text style={{ color: colors.secondaryForeground, fontWeight: "800" }}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => selectedPlan && saveInterestAndGoSupport(selectedPlan, "yes")}
                  disabled={!!requestingPlanId}
                  style={{
                    flex: 1,
                    height: 42,
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.primary,
                  }}
                >
                  <Text style={{ color: colors.primaryForeground, fontWeight: "800" }}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
	      </ScrollView>
	    </View>
	  );
	}
