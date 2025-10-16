import { THEME } from '../theme';
import { useColorScheme } from './use-color-scheme.web';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof THEME.light & keyof typeof THEME.dark
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return THEME[theme][colorName];
  }
}
