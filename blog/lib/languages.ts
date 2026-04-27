export type Language = { id: string; label: string; aliases?: string[] };

export const LANGUAGES: Language[] = [
  { id: 'plaintext', label: 'Plain Text', aliases: ['text', 'txt'] },
  { id: 'javascript', label: 'JavaScript', aliases: ['js'] },
  { id: 'typescript', label: 'TypeScript', aliases: ['ts'] },
  { id: 'jsx', label: 'JSX' },
  { id: 'tsx', label: 'TSX' },
  { id: 'java', label: 'Java' },
  { id: 'kotlin', label: 'Kotlin' },
  { id: 'scala', label: 'Scala' },
  { id: 'python', label: 'Python', aliases: ['py'] },
  { id: 'c', label: 'C' },
  { id: 'cpp', label: 'C++', aliases: ['c++'] },
  { id: 'csharp', label: 'C#', aliases: ['cs', 'c#'] },
  { id: 'objectivec', label: 'Objective-C', aliases: ['objc', 'obj-c'] },
  { id: 'go', label: 'Go', aliases: ['golang'] },
  { id: 'rust', label: 'Rust', aliases: ['rs'] },
  { id: 'swift', label: 'Swift' },
  { id: 'dart', label: 'Dart' },
  { id: 'ruby', label: 'Ruby', aliases: ['rb'] },
  { id: 'php', label: 'PHP' },
  { id: 'elixir', label: 'Elixir', aliases: ['ex'] },
  { id: 'erlang', label: 'Erlang' },
  { id: 'haskell', label: 'Haskell', aliases: ['hs'] },
  { id: 'clojure', label: 'Clojure', aliases: ['clj'] },
  { id: 'lua', label: 'Lua' },
  { id: 'perl', label: 'Perl', aliases: ['pl'] },
  { id: 'r', label: 'R' },
  { id: 'groovy', label: 'Groovy' },

  { id: 'sql', label: 'SQL' },
  { id: 'graphql', label: 'GraphQL', aliases: ['gql'] },

  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'scss', label: 'SCSS' },
  { id: 'sass', label: 'Sass' },
  { id: 'less', label: 'Less' },

  { id: 'bash', label: 'Bash' },
  { id: 'sh', label: 'Shell', aliases: ['shell'] },
  { id: 'zsh', label: 'Zsh' },
  { id: 'fish', label: 'Fish' },
  { id: 'powershell', label: 'PowerShell', aliases: ['ps', 'pwsh'] },

  { id: 'json', label: 'JSON' },
  { id: 'yaml', label: 'YAML', aliases: ['yml'] },
  { id: 'toml', label: 'TOML' },
  { id: 'xml', label: 'XML' },
  { id: 'ini', label: 'INI' },
  { id: 'env', label: '.env' },

  { id: 'dockerfile', label: 'Dockerfile' },
  { id: 'makefile', label: 'Makefile' },
  { id: 'nginx', label: 'Nginx' },
  { id: 'apache', label: 'Apache' },
  { id: 'regex', label: 'Regex' },

  { id: 'markdown', label: 'Markdown', aliases: ['md'] },
  { id: 'diff', label: 'Diff', aliases: ['patch'] },
  { id: 'http', label: 'HTTP' },
  { id: 'protobuf', label: 'Protobuf', aliases: ['proto'] },
  { id: 'solidity', label: 'Solidity', aliases: ['sol'] },
];

export function searchLanguages(query: string, limit = 20): Language[] {
  const q = query.trim().toLowerCase();
  if (!q) return LANGUAGES.slice(0, limit);

  const score = (lang: Language): number => {
    const id = lang.id.toLowerCase();
    const label = lang.label.toLowerCase();
    const aliases = (lang.aliases ?? []).map((a) => a.toLowerCase());

    if (id === q || aliases.includes(q)) return 1000;
    if (id.startsWith(q)) return 500 - id.length;
    if (aliases.some((a) => a.startsWith(q))) return 450;
    if (label.toLowerCase().startsWith(q)) return 400;
    if (id.includes(q)) return 200;
    if (label.toLowerCase().includes(q)) return 100;
    if (aliases.some((a) => a.includes(q))) return 80;
    return 0;
  };

  return LANGUAGES.map((l) => [l, score(l)] as const)
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([l]) => l);
}
