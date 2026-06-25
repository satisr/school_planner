import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Switch, ActivityIndicator } from 'react-native';
import { getAppSettings, getTimetables, setSetting, deleteTimetable, saveTimetable, SavedTimetable, AppSettings } from '../lib/storage';
import { fetchTimetable, fetchTimetableList, TimetableListResponse } from '../lib/timetable-parser';
import { scheduleTimetableNotifications, requestNotificationPermissions } from '../lib/notifications';
import { exportToICS } from '../lib/ics-export';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [timetables, setTimetables] = useState<SavedTimetable[]>([]);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listData, setListData] = useState<TimetableListResponse | null>(null);

  const loadData = useCallback(async () => {
    const s = await getAppSettings();
    const t = await getTimetables();
    setSettings(s);
    setTimetables(t);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleImport = async (url: string = importUrl) => {
    if (!url) return;
    setImporting(true);
    try {
      // Try to fetch as a direct timetable first
      try {
        const data = await fetchTimetable(url);
        const id = await saveTimetable(url, data.title, data);
        await setSetting('active_timetable_id', id);
        setImportUrl('');
        setListData(null);
        await loadData();
        Alert.alert('Sukces', 'Plan został zaimportowany i ustawiony jako aktywny.');

        const updatedSettings = await getAppSettings();
        if (updatedSettings.notifications_enabled) {
          await scheduleTimetableNotifications(data);
        }
        return;
      } catch (e) {
        // If it fails, maybe it's a list?
        const list = await fetchTimetableList(url);
        if (list.classes.length > 0 || list.teachers.length > 0 || list.rooms.length > 0) {
          setListData(list);
          Alert.alert('Wybierz plan', 'Wykryto listę planów. Wybierz jeden z poniższych.');
        } else {
          throw e;
        }
      }
    } catch (e: any) {
      Alert.alert('Błąd', e.message);
    } finally {
      setImporting(false);
    }
  };

  const handleToggleNotifications = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert('Brak uprawnień', 'Musisz przyznać uprawnienia do powiadomień w ustawieniach systemu.');
        return;
      }
    }

    await setSetting('notifications_enabled', value);
    const updatedSettings = await getAppSettings();
    setSettings(updatedSettings);

    if (value && updatedSettings.active_timetable_id) {
      const active = await getTimetables();
      const current = active.find(t => t.id === updatedSettings.active_timetable_id);
      if (current) {
        await scheduleTimetableNotifications(JSON.parse(current.data));
      }
    }
  };

  const handleToggleNotifyAll = async (value: boolean) => {
    await setSetting('notify_all_lessons', value);
    const updatedSettings = await getAppSettings();
    setSettings(updatedSettings);

    if (updatedSettings.notifications_enabled && updatedSettings.active_timetable_id) {
        const active = await getTimetables();
        const current = active.find(t => t.id === updatedSettings.active_timetable_id);
        if (current) {
          await scheduleTimetableNotifications(JSON.parse(current.data));
        }
      }
  };

  const setActive = async (id: number) => {
    await setSetting('active_timetable_id', id);
    await loadData();
    const current = timetables.find(t => t.id === id);
    if (current && settings?.notifications_enabled) {
        await scheduleTimetableNotifications(JSON.parse(current.data));
    }
  };

  const handleDelete = (id: number) => {
    Alert.alert('Usuń plan', 'Czy na pewno chcesz usunąć ten plan?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          await deleteTimetable(id);
          if (settings?.active_timetable_id === id) {
            await setSetting('active_timetable_id', null);
          }
          await loadData();
        }
      }
    ]);
  };

  const handleExport = async (timetable: SavedTimetable) => {
    try {
      await exportToICS(JSON.parse(timetable.data));
    } catch (e: any) {
      Alert.alert('Błąd eksportu', e.message);
    }
  };

  if (loading) return null;

  return (
    <ScrollView className="flex-1 bg-slate-50 p-4">
      <View className="mb-8">
        <Text className="text-sm font-bold text-slate-400 uppercase mb-3">Importuj nowy plan</Text>
        <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <TextInput
            className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-3 text-slate-900"
            placeholder="Wklej URL planu (Optivum)"
            value={importUrl}
            onChangeText={setImportUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity
            className={`bg-blue-600 p-4 rounded-xl items-center ${importing ? 'opacity-70' : ''}`}
            onPress={() => handleImport()}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">Importuj plan</Text>
            )}
          </TouchableOpacity>
          <Text className="text-[10px] text-slate-400 mt-2 text-center">
            Przykład: https://www.pceikz.pl/pliki/planlekcji/index.html
          </Text>
        </View>
      </View>

      {listData && (
        <View className="mb-8">
          <Text className="text-sm font-bold text-slate-400 uppercase mb-3">Wybierz z listy</Text>
          <View className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm max-h-80">
            <ScrollView nestedScrollEnabled={true}>
              {listData.classes.length > 0 && (
                <>
                  <Text className="text-[10px] font-bold text-slate-400 p-2 bg-slate-50 uppercase">Klasy</Text>
                  {listData.classes.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      className="p-3 border-b border-slate-50"
                      onPress={() => handleImport(listData.urlBase + item.value)}
                    >
                      <Text className="text-slate-900">{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
              {listData.teachers.length > 0 && (
                <>
                  <Text className="text-[10px] font-bold text-slate-400 p-2 bg-slate-50 uppercase mt-2">Nauczyciele</Text>
                  {listData.teachers.map(item => (
                    <TouchableOpacity
                      key={item.value}
                      className="p-3 border-b border-slate-50"
                      onPress={() => handleImport(listData.urlBase + item.value)}
                    >
                      <Text className="text-slate-900">{item.name}</Text>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      )}

      <View className="mb-8">
        <Text className="text-sm font-bold text-slate-400 uppercase mb-3">Twoje plany</Text>
        {timetables.length === 0 ? (
          <Text className="text-slate-400 italic px-2">Brak zapisanych planów.</Text>
        ) : (
          timetables.map(t => (
            <View key={t.id} className={`bg-white p-4 rounded-2xl border mb-3 shadow-sm ${settings?.active_timetable_id === t.id ? 'border-blue-500' : 'border-slate-200'}`}>
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-1">
                  <Text className="font-bold text-slate-900">{t.title}</Text>
                  <Text className="text-[10px] text-slate-400 truncate" numberOfLines={1}>{t.url}</Text>
                </View>
                {settings?.active_timetable_id === t.id && (
                  <View className="bg-blue-100 px-2 py-1 rounded-lg ml-2">
                    <Text className="text-[10px] font-bold text-blue-600">AKTYWNY</Text>
                  </View>
                )}
              </View>

              <View className="flex-row justify-between">
                <View className="flex-row">
                    <TouchableOpacity
                    onPress={() => setActive(t.id)}
                    className="mr-4"
                    >
                    <Text className={`text-sm font-bold ${settings?.active_timetable_id === t.id ? 'text-blue-400' : 'text-blue-600'}`}>Ustaw jako aktywny</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleExport(t)}>
                        <Ionicons name="share-outline" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => handleDelete(t.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      <View className="mb-8">
        <Text className="text-sm font-bold text-slate-400 uppercase mb-3">Powiadomienia</Text>
        <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <View className="flex-row justify-between items-center py-2 border-b border-slate-50">
            <View>
              <Text className="font-bold text-slate-900">Włącz przypomnienia</Text>
              <Text className="text-xs text-slate-400">10 minut przed lekcją</Text>
            </View>
            <Switch
              value={settings?.notifications_enabled}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={settings?.notifications_enabled ? '#2563eb' : '#f8fafc'}
            />
          </View>

          <View className="flex-row justify-between items-center py-2 mt-2">
            <View>
              <Text className="font-bold text-slate-900">Przed każdą lekcją</Text>
              <Text className="text-xs text-slate-400">Domyślnie tylko przed pierwszą</Text>
            </View>
            <Switch
              value={settings?.notify_all_lessons}
              onValueChange={handleToggleNotifyAll}
              disabled={!settings?.notifications_enabled}
              trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
              thumbColor={settings?.notify_all_lessons ? '#2563eb' : '#f8fafc'}
            />
          </View>
        </View>
      </View>
      <View className="h-20" />
    </ScrollView>
  );
}
