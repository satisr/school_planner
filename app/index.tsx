import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { getAppSettings, getTimetableById, SavedTimetable } from '../lib/storage';
import { TimetableData, Lesson } from '../lib/timetable-parser';
import { useFocusEffect, useRouter } from 'expo-router';

const DAYS = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];

export default function TimetableScreen() {
  const [activeTimetable, setActiveTimetable] = useState<SavedTimetable | null>(null);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() === 0 ? 0 : new Date().getDay() - 1); // 0-6, default to today (or Monday if Sunday)
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    const settings = await getAppSettings();
    if (settings.active_timetable_id) {
      const timetable = await getTimetableById(settings.active_timetable_id);
      setActiveTimetable(timetable);
    } else {
      setActiveTimetable(null);
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!activeTimetable) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-slate-50">
        <Text className="text-xl font-bold text-slate-900 mb-2">Brak aktywnego planu</Text>
        <Text className="text-slate-600 text-center mb-6">Importuj swój pierwszy plan lekcji w ustawieniach.</Text>
        <TouchableOpacity
          className="bg-blue-600 px-6 py-3 rounded-xl"
          onPress={() => router.push('/settings')}
        >
          <Text className="text-white font-semibold">Przejdź do ustawień</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const data: TimetableData = JSON.parse(activeTimetable.data);
  const lessonsForDay = data.days[selectedDay] || [];

  return (
    <View className="flex-1 bg-slate-50">
      <View className="bg-white border-b border-slate-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="py-3 px-4">
          {DAYS.map((day, idx) => (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(idx)}
              className={`mr-3 px-4 py-2 rounded-full ${selectedDay === idx ? 'bg-blue-600' : 'bg-slate-100'}`}
            >
              <Text className={`font-medium ${selectedDay === idx ? 'text-white' : 'text-slate-600'}`}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 p-4">
        <Text className="text-slate-500 mb-4 font-medium">{activeTimetable.title}</Text>

        {lessonsForDay.length === 0 || lessonsForDay.every(slot => !slot || slot.length === 0) ? (
          <View className="bg-white p-8 rounded-2xl border border-slate-200 items-center">
            <Text className="text-slate-400 italic">Brak lekcji w tym dniu</Text>
          </View>
        ) : (
          lessonsForDay.map((timeSlot, slotIdx) => {
            if (!timeSlot || timeSlot.length === 0) return null;
            const hour = data.hours[slotIdx + 1];

            return (
              <View key={slotIdx} className="flex-row mb-4">
                <View className="w-16 pt-1">
                  <Text className="text-sm font-bold text-slate-900">{hour?.time.split('-')[0]}</Text>
                  <Text className="text-xs text-slate-400">{hour?.time.split('-')[1]}</Text>
                  <Text className="text-[10px] text-slate-300 font-bold mt-1">NR {slotIdx + 1}</Text>
                </View>

                <View className="flex-1">
                  {timeSlot.map((lesson, lessonIdx) => (
                    <View
                      key={lessonIdx}
                      className="bg-white p-4 rounded-2xl border border-slate-200 mb-2 shadow-sm"
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-lg font-bold text-slate-900 leading-tight">
                            {lesson.subject}
                          </Text>
                          {lesson.groupName && (
                            <Text className="text-xs font-semibold text-blue-600 mt-0.5">
                              GRUPA: {lesson.groupName}
                            </Text>
                          )}
                        </View>
                        <View className="bg-slate-100 px-2 py-1 rounded-lg">
                          <Text className="text-xs font-bold text-slate-600">{lesson.room}</Text>
                        </View>
                      </View>

                      <View className="mt-3 flex-row justify-between items-center">
                        <Text className="text-sm text-slate-500">{lesson.teacher}</Text>
                        <Text className="text-xs text-slate-400">{lesson.className}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })
        )}
        <View className="h-10" />
      </ScrollView>
    </View>
  );
}
