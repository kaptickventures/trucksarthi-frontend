import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { useThemeStore } from '@/hooks/useThemeStore';

interface Column<T> {
  key: keyof T;
  title: string;
  render?: (value: any, item: T) => string | React.ReactNode;
  width?: string | number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

const DataTable = React.forwardRef<any, DataTableProps<any>>(
  (
    {
      columns,
      data,
      keyExtractor,
      onRowClick,
      isLoading = false,
      emptyMessage = 'No data available',
    },
    ref
  ) => {
    const { colors } = useThemeStore();

    if (Platform.OS !== 'web') return null;

    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <View
          style={{
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: colors.card,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          {columns.map((col, idx) => (
            <View
              key={idx}
              style={{
                flex: 1,
                padding: 12,
                borderRightWidth: idx < columns.length - 1 ? 1 : 0,
                borderRightColor: colors.border,
              }}
            >
              <Text style={{ color: colors.foreground, fontWeight: '700', fontSize: 14 }}>
                {col.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Body */}
        <View>
          {isLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.muted }}>Loading...</Text>
            </View>
          ) : data.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ color: colors.muted }}>{emptyMessage}</Text>
            </View>
          ) : (
            data.map((item, rowIdx) => (
              <TouchableOpacity
                key={keyExtractor(item, rowIdx)}
                onPress={() => onRowClick?.(item)}
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  backgroundColor: rowIdx % 2 === 0 ? colors.background : colors.card,
                }}
              >
                {columns.map((col, idx) => (
                  <View
                    key={idx}
                    style={{
                      flex: 1,
                      padding: 12,
                      borderRightWidth: idx < columns.length - 1 ? 1 : 0,
                      borderRightColor: colors.border,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 13,
                        fontWeight: '400',
                      }}
                    >
                      {col.render
                        ? col.render(item[col.key], item)
                        : String(item[col.key])}
                    </Text>
                  </View>
                ))}
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
    );
  }
);

DataTable.displayName = 'DataTable';

export default DataTable;
