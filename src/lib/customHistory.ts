import { Extension } from "@tiptap/core";
import { history, redo, undo } from "@tiptap/pm/history";

export interface HistoryOptions {
    depth: number,
    newGroupDelay: number,
  }
  
  declare module '@tiptap/core' {
    interface Commands<ReturnType> {
      history: {
        /**
         * Undo recent changes
         */
        undo: () => ReturnType,
        /**
         * Reapply reverted changes
         */
        redo: () => ReturnType,
      }
    }
  }
  
  export const CustomHistory = Extension.create<HistoryOptions>({
    name: 'history',
  
    addOptions() {
      return {
        depth: 100,
        newGroupDelay: 500,
      }
    },
  
    addCommands() {
      return {
        undo: () => ({ state, dispatch,tr }) => {
          console.debug('customhistoryundo');
          console.debug(tr.getMeta('addToHistory'));
          return undo(state, dispatch)
        },
        redo: () => ({ state, dispatch,tr }) => {
            console.debug('customhistoryredo');
            console.debug(tr.getMeta('addToHistory'));
          return redo(state, dispatch)
        },
      }
    },
    
  
    addProseMirrorPlugins() {
      return [
        history(this.options),
      ]
    },
  
    addKeyboardShortcuts() {
      return {
        'Mod-z': () => this.editor.commands.undo(),
        'Shift-Mod-z': () => this.editor.commands.redo(),
        'Mod-y': () => this.editor.commands.redo(),
  
        // Russian keyboard layouts
        'Mod-я': () => this.editor.commands.undo(),
        'Shift-Mod-я': () => this.editor.commands.redo(),
      }
    },
  })