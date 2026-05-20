import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/i18n';
import { type ReactNode } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { WebOnlyColorSchemeUpdater } from './ColorSchemeUpdater';
import { WebOnlyPrettyScrollbar } from './PrettyScrollbar'
import { HeroUINativeProvider } from '@/heroui';

function Provider({ children }: { children: ReactNode }) {
  return <WebOnlyColorSchemeUpdater>
    <WebOnlyPrettyScrollbar>
      <AuthProvider>
        <LanguageProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <HeroUINativeProvider>
              {children}
            </HeroUINativeProvider>
          </GestureHandlerRootView>
        </LanguageProvider>
      </AuthProvider>
    </WebOnlyPrettyScrollbar>
  </WebOnlyColorSchemeUpdater>
}

export {
  Provider,
}
