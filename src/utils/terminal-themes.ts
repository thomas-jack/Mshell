/**
 * Terminal theme definitions
 * 优化后的终端主题 - 增强差异化和颜色对比度
 */

export interface TerminalTheme {
  name: string
  background: string
  foreground: string
  cursor: string
  cursorAccent?: string
  selectionBackground?: string
  selectionForeground?: string
  black: string
  red: string
  green: string
  yellow: string
  blue: string
  magenta: string
  cyan: string
  white: string
  brightBlack: string
  brightRed: string
  brightGreen: string
  brightYellow: string
  brightBlue: string
  brightMagenta: string
  brightCyan: string
  brightWhite: string
}

export const themes: Record<string, TerminalTheme> = {
  // ==================== 深色主题 ====================
  
  // 默认深色 - 经典黑色，高对比度
  dark: {
    name: '经典深色',
    background: '#0d0d0d',
    foreground: '#e0e0e0',
    cursor: '#00ff00',
    cursorAccent: '#000000',
    selectionBackground: '#3a3a3a',
    selectionForeground: '#ffffff',
    black: '#000000',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#6d9eff',      // 增亮蓝色
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6b6b6b', // 增亮以提高可读性
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#a0c4ff',  // 增亮
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff'
  },

  // Dracula - 紫色调暗色主题
  dracula: {
    name: 'Dracula 暗紫',
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#ff79c6',
    cursorAccent: '#282a36',
    selectionBackground: '#44475a',
    selectionForeground: '#ffffff',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
    brightBlack: '#6272a4',
    brightRed: '#ff6e6e',
    brightGreen: '#69ff94',
    brightYellow: '#ffffa5',
    brightBlue: '#d6acff',
    brightMagenta: '#ff92df',
    brightCyan: '#a4ffff',
    brightWhite: '#ffffff'
  },

  // One Dark - 蓝灰色调
  oneDark: {
    name: 'One Dark 蓝灰',
    background: '#282c34',
    foreground: '#abb2bf',
    cursor: '#528bff',
    cursorAccent: '#282c34',
    selectionBackground: '#3e4451',
    selectionForeground: '#ffffff',
    black: '#1e2127',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#e5c07b',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
    brightBlack: '#7f848e',  // 增亮
    brightRed: '#f44747',
    brightGreen: '#b5e890',
    brightYellow: '#f0d67b',
    brightBlue: '#7cc4f4',   // 增亮
    brightMagenta: '#db8fe8',
    brightCyan: '#6fd4e0',
    brightWhite: '#ffffff'
  },

  // Nord - 北极蓝色调
  nord: {
    name: 'Nord 极光蓝',
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#88c0d0',
    cursorAccent: '#2e3440',
    selectionBackground: '#434c5e',
    selectionForeground: '#eceff4',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
    brightBlack: '#616e88',  // 增亮
    brightRed: '#d08770',
    brightGreen: '#a3be8c',
    brightYellow: '#ebcb8b',
    brightBlue: '#5e81ac',
    brightMagenta: '#b48ead',
    brightCyan: '#8fbcbb',
    brightWhite: '#eceff4'
  },

  // Monokai - 经典编辑器主题
  monokai: {
    name: 'Monokai 经典',
    background: '#272822',
    foreground: '#f8f8f2',
    cursor: '#f8f8f0',
    cursorAccent: '#272822',
    selectionBackground: '#49483e',
    selectionForeground: '#f8f8f2',
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#f4bf75',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a1efe4',
    white: '#f8f8f2',
    brightBlack: '#8c8c8c',  // 增亮
    brightRed: '#f92672',
    brightGreen: '#a6e22e',
    brightYellow: '#f4bf75',
    brightBlue: '#66d9ef',
    brightMagenta: '#ae81ff',
    brightCyan: '#a1efe4',
    brightWhite: '#f9f8f5'
  },

  // Solarized Dark - 经典护眼深色
  solarizedDark: {
    name: 'Solarized 深色',
    background: '#002b36',
    foreground: '#839496',
    cursor: '#93a1a1',
    cursorAccent: '#002b36',
    selectionBackground: '#073642',
    selectionForeground: '#93a1a1',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#657b83',  // 增亮
    brightRed: '#cb4b16',
    brightGreen: '#859900',
    brightYellow: '#b58900',
    brightBlue: '#268bd2',
    brightMagenta: '#6c71c4',
    brightCyan: '#2aa198',
    brightWhite: '#fdf6e3'
  },

  // Gruvbox Dark - 复古暖色调
  gruvboxDark: {
    name: 'Gruvbox 暖棕',
    background: '#282828',
    foreground: '#ebdbb2',
    cursor: '#fe8019',
    cursorAccent: '#282828',
    selectionBackground: '#504945',
    selectionForeground: '#ebdbb2',
    black: '#282828',
    red: '#fb4934',       // 更亮的红色
    green: '#b8bb26',     // 更亮的绿色
    yellow: '#fabd2f',    // 更亮的黄色
    blue: '#83a598',
    magenta: '#d3869b',
    cyan: '#8ec07c',
    white: '#ebdbb2',
    brightBlack: '#928374',
    brightRed: '#fb4934',
    brightGreen: '#b8bb26',
    brightYellow: '#fabd2f',
    brightBlue: '#83a598',
    brightMagenta: '#d3869b',
    brightCyan: '#8ec07c',
    brightWhite: '#ebdbb2'
  },

  // Tokyo Night - 东京夜色
  tokyoNight: {
    name: 'Tokyo Night 夜色',
    background: '#1a1b26',
    foreground: '#c0caf5',
    cursor: '#c0caf5',
    cursorAccent: '#1a1b26',
    selectionBackground: '#33467c',
    selectionForeground: '#c0caf5',
    black: '#15161e',
    red: '#f7768e',
    green: '#9ece6a',
    yellow: '#e0af68',
    blue: '#7aa2f7',
    magenta: '#bb9af7',
    cyan: '#7dcfff',
    white: '#a9b1d6',
    brightBlack: '#565f89',  // 增亮
    brightRed: '#f7768e',
    brightGreen: '#9ece6a',
    brightYellow: '#e0af68',
    brightBlue: '#7aa2f7',
    brightMagenta: '#bb9af7',
    brightCyan: '#7dcfff',
    brightWhite: '#c0caf5'
  },

  // Catppuccin Mocha - 柔和深色
  catppuccin: {
    name: 'Catppuccin 柔雾',
    background: '#1e1e2e',
    foreground: '#cdd6f4',
    cursor: '#f5e0dc',
    cursorAccent: '#1e1e2e',
    selectionBackground: '#45475a',
    selectionForeground: '#cdd6f4',
    black: '#45475a',
    red: '#f38ba8',
    green: '#a6e3a1',
    yellow: '#f9e2af',
    blue: '#89b4fa',
    magenta: '#f5c2e7',
    cyan: '#94e2d5',
    white: '#bac2de',
    brightBlack: '#6c7086',  // 增亮
    brightRed: '#f38ba8',
    brightGreen: '#a6e3a1',
    brightYellow: '#f9e2af',
    brightBlue: '#89b4fa',
    brightMagenta: '#f5c2e7',
    brightCyan: '#94e2d5',
    brightWhite: '#cdd6f4'
  },

  // Cyberpunk - 赛博朋克霓虹
  cyberpunk: {
    name: 'Cyberpunk 霓虹',
    background: '#0a0a0f',
    foreground: '#00ff9f',
    cursor: '#ff00ff',
    cursorAccent: '#0a0a0f',
    selectionBackground: '#1a1a2e',
    selectionForeground: '#00ffff',
    black: '#0a0a0f',
    red: '#ff0055',
    green: '#00ff9f',
    yellow: '#ffff00',
    blue: '#00aaff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
    brightBlack: '#444466',  // 增亮
    brightRed: '#ff3377',
    brightGreen: '#33ffaa',
    brightYellow: '#ffff55',
    brightBlue: '#55bbff',
    brightMagenta: '#ff55ff',
    brightCyan: '#55ffff',
    brightWhite: '#ffffff'
  },

  // Matrix - 黑客帝国绿
  matrix: {
    name: 'Matrix 黑客',
    background: '#000000',
    foreground: '#00ff00',
    cursor: '#00ff00',
    cursorAccent: '#000000',
    selectionBackground: '#003300',
    selectionForeground: '#00ff00',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#00aaff',       // 更亮的蓝色
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#00ff00',
    brightBlack: '#008800',  // 增亮
    brightRed: '#ff5555',
    brightGreen: '#55ff55',
    brightYellow: '#ffff55',
    brightBlue: '#55aaff',
    brightMagenta: '#ff55ff',
    brightCyan: '#55ffff',
    brightWhite: '#ffffff'
  },

  // ==================== 浅色主题 ====================

  // 默认浅色 - 高对比度
  light: {
    name: '经典浅色',
    background: '#ffffff',
    foreground: '#1a1a1a',
    cursor: '#000000',
    cursorAccent: '#ffffff',
    selectionBackground: '#b4d5fe',
    selectionForeground: '#000000',
    black: '#000000',
    red: '#c91b00',
    green: '#00a600',
    yellow: '#a68a00',     // 降低亮度以提高可读性
    blue: '#0451a5',
    magenta: '#bc05bc',
    cyan: '#0598bc',
    white: '#777777',
    brightBlack: '#555555',
    brightRed: '#ff6e67',
    brightGreen: '#00d600',
    brightYellow: '#c7a000',  // 降低亮度
    brightBlue: '#2472c8',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#f8f8f8'
  },

  // Solarized Light - 经典护眼浅色
  solarizedLight: {
    name: 'Solarized 浅色',
    background: '#fdf6e3',
    foreground: '#657b83',
    cursor: '#586e75',
    cursorAccent: '#fdf6e3',
    selectionBackground: '#eee8d5',
    selectionForeground: '#586e75',
    black: '#073642',
    red: '#dc322f',
    green: '#859900',
    yellow: '#b58900',
    blue: '#268bd2',
    magenta: '#d33682',
    cyan: '#2aa198',
    white: '#eee8d5',
    brightBlack: '#839496',
    brightRed: '#cb4b16',
    brightGreen: '#859900',
    brightYellow: '#b58900',
    brightBlue: '#268bd2',
    brightMagenta: '#6c71c4',
    brightCyan: '#2aa198',
    brightWhite: '#fdf6e3'
  },

  // GitHub Light - GitHub 风格
  githubLight: {
    name: 'GitHub 浅色',
    background: '#f6f8fa',
    foreground: '#24292e',
    cursor: '#044289',
    cursorAccent: '#f6f8fa',
    selectionBackground: '#c8e1ff',
    selectionForeground: '#24292e',
    black: '#24292e',
    red: '#d73a49',
    green: '#22863a',
    yellow: '#b08800',
    blue: '#0366d6',
    magenta: '#6f42c1',
    cyan: '#1b7c83',
    white: '#6a737d',
    brightBlack: '#586069',
    brightRed: '#cb2431',
    brightGreen: '#28a745',
    brightYellow: '#dbab09',
    brightBlue: '#2188ff',
    brightMagenta: '#8a63d2',
    brightCyan: '#3192aa',
    brightWhite: '#d1d5da'
  },

  // Gruvbox Light - 复古暖色浅色
  gruvboxLight: {
    name: 'Gruvbox 暖白',
    background: '#fbf1c7',
    foreground: '#3c3836',
    cursor: '#d65d0e',
    cursorAccent: '#fbf1c7',
    selectionBackground: '#d5c4a1',
    selectionForeground: '#3c3836',
    black: '#3c3836',
    red: '#cc241d',
    green: '#98971a',
    yellow: '#d79921',
    blue: '#458588',
    magenta: '#b16286',
    cyan: '#689d6a',
    white: '#7c6f64',
    brightBlack: '#928374',
    brightRed: '#9d0006',
    brightGreen: '#79740e',
    brightYellow: '#b57614',
    brightBlue: '#076678',
    brightMagenta: '#8f3f71',
    brightCyan: '#427b58',
    brightWhite: '#3c3836'
  },

  // Paper - 纸张白
  paper: {
    name: 'Paper 纸白',
    background: '#eeeeee',
    foreground: '#444444',
    cursor: '#444444',
    cursorAccent: '#eeeeee',
    selectionBackground: '#d0d0d0',
    selectionForeground: '#444444',
    black: '#000000',
    red: '#cc3e28',
    green: '#216609',
    yellow: '#b58900',
    blue: '#1e6fcc',
    magenta: '#5c21a5',
    cyan: '#158c86',
    white: '#888888',
    brightBlack: '#666666',
    brightRed: '#cc3e28',
    brightGreen: '#216609',
    brightYellow: '#b58900',
    brightBlue: '#1e6fcc',
    brightMagenta: '#5c21a5',
    brightCyan: '#158c86',
    brightWhite: '#ffffff'
  }
}

export const getTheme = (name: string): TerminalTheme => {
  return themes[name] || themes.dark
}

export const getThemeNames = (): string[] => {
  return Object.keys(themes)
}
