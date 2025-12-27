import { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { fetchLiveProperties } from './src/api';
import { Property } from './src/types';

const ENV_KEY = process.env.EXPO_PUBLIC_AGENCY_KEY || '';
const ENV_SOURCES = process.env.EXPO_PUBLIC_SOURCES || '';

export default function App() {
  const [data, setData] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [keyValue, setKeyValue] = useState(ENV_KEY);
  const [sourcesValue, setSourcesValue] = useState(ENV_SOURCES);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchLiveProperties(keyValue, sourcesValue);
      setData(items);
    } catch (e: any) {
      setError(e?.message || 'Failed to load properties');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyValue, sourcesValue]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const renderItem = ({ item }: { item: Property }) => {
    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.7}>
        <Text style={styles.address}>{item.addressText}</Text>
        <View style={styles.row}>
          {item.priceText ? <Text style={styles.chip}>€ {item.priceText}</Text> : null}
          {item.saleType ? <Text style={styles.chip}>{item.saleType}</Text> : null}
          {item.propertyType ? <Text style={styles.chip}>{item.propertyType}</Text> : null}
        </View>
        <View style={styles.metaRow}>
          {item.bedroomsText ? <Text style={styles.meta}>{item.bedroomsText} bd</Text> : null}
          {item.bathroomsText ? <Text style={styles.meta}>{item.bathroomsText} ba</Text> : null}
          {typeof item.pictureCount === 'number' ? <Text style={styles.meta}>{item.pictureCount} pics</Text> : null}
        </View>
        <View style={styles.metaRow}>
          {item.agentText ? <Text style={styles.meta}>{item.agentText}</Text> : null}
          {item.updatedText ? <Text style={styles.meta}>{item.updatedText}</Text> : null}
          {item.sourceText ? <Text style={styles.meta}>{item.sourceText}</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>PDL Properties</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Refresh</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.controls}>
        <TextInput
          value={keyValue}
          onChangeText={setKeyValue}
          placeholder="Agency key"
          style={styles.input}
          autoCapitalize="none"
        />
        <TextInput
          value={sourcesValue}
          onChangeText={setSourcesValue}
          placeholder="Sources (e.g. daft,myhome)"
          style={styles.input}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={load} style={styles.refreshBtn}>
          <Text style={styles.refreshText}>Load</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={styles.meta}>Loading...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.refreshBtn}>
            <Text style={styles.refreshText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.meta}>No properties found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f5fb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  controls: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  refreshBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  refreshText: { color: '#fff', fontWeight: '600' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  address: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  chip: {
    backgroundColor: '#ede9fe',
    color: '#4c1d95',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  meta: { fontSize: 12, color: '#4b5563' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  error: { color: '#b91c1c', marginBottom: 8, textAlign: 'center' },
});
