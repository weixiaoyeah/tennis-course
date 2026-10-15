import { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useLanguage, type Language } from '@/i18n';

// 语言选项
const LANGUAGE_OPTIONS: { code: Language; label: string; native: string }[] = [
  { code: 'zh', label: '中文', native: '中文' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'ar', label: 'العربية', native: 'العربية' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  const current = LANGUAGE_OPTIONS.find((o) => o.code === language) || LANGUAGE_OPTIONS[0];

  const handleSelect = useCallback(
    (code: Language) => {
      setLanguage(code);
      setOpen(false);
    },
    [setLanguage]
  );

  return (
    <View>
      {/* 触发器按钮 */}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        className="bg-gradient-to-r from-orange-400 to-amber-400 px-3 py-1.5 rounded-full flex-row items-center shadow-sm"
      >
        <FontAwesome6 name="globe" size={12} color="white" />
        <Text className="text-white text-xs ml-1.5 font-semibold">{current.native}</Text>
        <FontAwesome6 name="chevron-down" size={10} color="white" style={{ marginLeft: 6 }} />
      </TouchableOpacity>

      {/* 下拉菜单 */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable className="flex-1" onPress={() => setOpen(false)}>
          {/* 空点击区域关闭 */}
          <Pressable
            className="absolute top-0 right-0 bottom-0 left-0 bg-black/30"
            onPress={() => setOpen(false)}
          />
          <View className="flex-1 justify-center items-center px-6">
            <Pressable className="w-full max-w-xs bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100">
              {LANGUAGE_OPTIONS.map((opt, index) => {
                const isActive = opt.code === language;
                return (
                  <Pressable
                    key={opt.code}
                    onPress={() => handleSelect(opt.code)}
                    className={`flex-row items-center justify-between px-5 py-4 ${index < LANGUAGE_OPTIONS.length - 1 ? 'border-b border-gray-100' : ''} ${isActive ? 'bg-orange-50' : ''}`}
                  >
                    <View className="flex-row items-center">
                      <Text className={`text-base font-semibold ${isActive ? 'text-orange-600' : 'text-gray-800'}`}>
                        {opt.label}
                      </Text>
                      {isActive && (
                        <View className="ml-2 bg-gradient-to-r from-orange-400 to-amber-400 px-1.5 py-0.5 rounded-full">
                          <Text className="text-white text-[10px] font-semibold">✓</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}