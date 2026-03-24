import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';
import {
  BarChart3,
  TrendingUp,
  Users,
  Truck,
  Download,
} from 'lucide-react-native';

export default function WebReports() {
  const { colors } = useThemeStore();

  if (Platform.OS !== 'web') return null;

  const reportTypes = [
    {
      title: 'Profit & Loss',
      icon: <TrendingUp size={20} color="white" />,
      color: '#3b82f6',
      description: 'Monthly financial overview',
      stats: 'Net Profit: ₹3,50,000',
    },
    {
      title: 'Driver Performance',
      icon: <Users size={20} color="white" />,
      color: '#8b5cf6',
      description: 'Driver metrics and earnings',
      stats: 'Top Driver: Raj Kumar',
    },
    {
      title: 'Fleet Utilization',
      icon: <Truck size={20} color="white" />,
      color: '#ef4444',
      description: 'Truck usage and efficiency',
      stats: 'Avg Utilization: 78%',
    },
    {
      title: 'Client Analysis',
      icon: <Users size={20} color="white" />,
      color: '#22c55e',
      description: 'Client revenue and trips',
      stats: 'Top Client: Shyam Transport',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <View>
          <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700' }}>
            Reports
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, marginTop: 4 }}>
            Generate and analyze business reports
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 6,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Download size={18} color={colors.foreground} />
          <Text style={{ color: colors.foreground, fontWeight: '600' }}>Export All</Text>
        </TouchableOpacity>
      </View>

      {/* Report Types */}
      <View style={{ marginBottom: 32 }}>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>
          Available Reports
        </Text>
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {reportTypes.map((report, idx) => (
            <View key={idx} style={{ flex: 1, minWidth: 280 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: colors.card,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 12,
                  padding: 20,
                  minHeight: 180,
                }}
              >
                <View
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <View>
                    <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '700' }}>
                      {report.title}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>
                      {report.description}
                    </Text>
                  </View>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: report.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {report.icon}
                  </View>
                </View>

                <View style={{ marginTop: 'auto' }}>
                  <Text style={{ color: colors.muted, fontSize: 11 }}>Key Metric</Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontWeight: '600',
                      fontSize: 13,
                      marginTop: 4,
                    }}
                  >
                    {report.stats}
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    marginTop: 12,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    backgroundColor: report.color,
                    borderRadius: 6,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                    View Report
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Insights */}
      <View
        style={{
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BarChart3 size={20} color="white" />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700' }}>
            This Month&apos;s Insights
          </Text>
        </View>

        <View style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Total Revenue', value: '₹5,24,000', change: '+12%' },
            { label: 'Operating Cost', value: '₹1,56,000', change: '-3%' },
            { label: 'Net Profit', value: '₹3,68,000', change: '+18%' },
            { label: 'Avg Trip Value', value: '₹4,250', change: '+5%' },
          ].map((item, idx) => (
            <View
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingVertical: 10,
                borderBottomWidth: idx < 3 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <View>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {item.label}
                </Text>
                <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14, marginTop: 2 }}>
                  {item.value}
                </Text>
              </View>
              <Text
                style={{
                  color: item.change.startsWith('+') ? '#22c55e' : '#ef4444',
                  fontWeight: '600',
                  fontSize: 13,
                }}
              >
                {item.change}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
