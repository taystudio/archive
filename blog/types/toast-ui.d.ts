declare module '@toast-ui/editor' {
  const Editor: {
    new (options: {
      el: HTMLElement;
      initialValue?: string;
      initialEditType?: 'markdown' | 'wysiwyg';
      previewStyle?: 'tab' | 'vertical';
      height?: string;
      usageStatistics?: boolean;
      autofocus?: boolean;
      plugins?: unknown[];
      toolbarItems?: (string | object)[][];
      hooks?: {
        addImageBlobHook?: (
          blob: Blob,
          callback: (url: string, alt?: string) => void,
        ) => void | Promise<void>;
      };
      [k: string]: unknown;
    }): Editor;
  };
  interface Editor {
    getMarkdown(): string;
    setMarkdown(md: string): void;
    on(event: string, cb: () => void): void;
    destroy(): void;
  }
  export default Editor;
}

declare module '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js' {
  const plugin: unknown;
  export default plugin;
}
