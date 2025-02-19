import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { useComposedRefs } from './compose-refs';

interface NumberInputProps extends React.ComponentProps<typeof Input> {
  min?: number;
  max?: number;
  integer?: boolean;

  /** Small and large nudge amounts */
  increments?: [number, number];
}

export const NumberInput = ({
  integer = false,
  min = -Infinity,
  max = Infinity,
  increments = [1, 10],
  format = (value) => {
    const float = parseFloat(value);
    return Number.isInteger(float) ? value : float.toFixed(3);
  },
  ...props
}: NumberInputProps) => {
  const ref = useRef<InputHandle>(null);

  return (
    <Input
      {...props}
      format={format}
      ref={useComposedRefs(ref, props.ref)}
      onKeyDown={(event) => {
        if (!ref.current) {
          return;
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          event.preventDefault();
          const direction = event.key === 'ArrowUp' ? 1 : -1;
          const [smallIncrement, largeIncrement] = increments;
          let amount = event.shiftKey ? largeIncrement : smallIncrement;

          const defaultNumber = Math.max(min, Math.min(0, max));
          const value = ref.current.value;

          const defaultValue = defaultNumber;
          let number = defaultNumber;
          let newValue = defaultValue;

          if (value !== null) {
            number = integer ? parseInt(value) : parseFloat(value);
          }

          if (!Number.isNaN(number)) {
            newValue = decimal(Math.min(max, Math.max(min, number + amount * direction)));
          }

          flushSync(() => ref.current?.commitValue(newValue.toString()));
          ref.current.select();
        }

        props.onKeyDown?.(event);
      }}
    />
  );
};

export type InputHandle = HTMLInputElement & {
  /** A handle to directly set the input's internal value */
  setValue: (value: string) => void;

  /** A handle to save the value: parses, validates, and calls `onValueCommit` */
  commitValue: (value: string) => void;
};

export interface InputProps extends React.ComponentPropsWithoutRef<'input'> {
  ref?: React.Ref<InputHandle | null>;

  value: string;
  defaultValue?: never;
  onValueCommit?: (value: string) => void;

  /**
   * A function to visually transform the incoming value when it is displayed in the input.
   */
  format?: (value: string) => string;

  /**
   * A function to parse the value that user entered into the input.
   * By default, collapses consecutive whitespace and trims the value.
   *
   * Should return `null` when the value can't be parsed; the input will
   * revert to the previously committed value in this case.
   *
   * Checks for `!!value` by default.
   */
  parse?: (value: string) => string | null;

  /**
   * A function used to customise how input contents are selected when clicking into the input.
   * Defaults to `(input) => input?.select()`
   */
  select?: (input: HTMLInputElement | null) => void;
}

export function Input({ onValueCommit, format = defaultFormatter, parse = defaultParser, ...props }: InputProps) {
  const sourceValue = format(props.value);
  const [value, setValue] = useState(sourceValue);
  const [input, setInput] = useState<HTMLInputElement | null>(null);
  const isDirty = useRef(false);

  // Track the external value prop if the input isn't focused.
  // Makes sure that the internal value doesn't get stale if props don't change.
  const shouldResetValue = input && document.activeElement !== input && sourceValue !== value;
  if (shouldResetValue) {
    setValue(sourceValue);
  }

  function commitValue(value: string) {
    const parsed = parse(value);

    if (parsed === null) {
      setValue(sourceValue);
      return;
    }

    const formatted = format(parsed);
    setValue(formatted);
    onValueCommit?.(parsed);
  }

  const commitValueRef = useRef(commitValue);
  commitValueRef.current = commitValue;

  useImperativeHandle<InputHandle | null, InputHandle | null>(
    props.ref,
    function () {
      if (input) {
        return Object.assign(input, {
          setValue,
          commitValue: function (value: string) {
            commitValueRef.current(value);
          },
        });
      }
      return null;
    },
    [input]
  );

  function handleBlur() {
    if (isDirty.current) {
      commitValue(value);
    }

    isDirty.current = false;
  }

  // Run the blur handler on unmount
  const handleBlurRef = useRef(handleBlur);
  handleBlurRef.current = handleBlur;
  useEffect(() => {
    return () => handleBlurRef.current();
  }, []);

  return (
    <input
      {...baseInputProps}
      {...props}
      ref={setInput}
      value={value}
      onBlur={(event) => {
        handleBlur();
        props.onBlur?.(event);
      }}
      onFocus={(event) => {
        event.target.select();
        props.onFocus?.(event);
      }}
      onChange={(event) => {
        isDirty.current = true;
        setValue(event.target.value);
        props.onChange?.(event);
      }}
      onBeforeInput={() => {
        // Catch input that doesn't result in `onChange` callback
        // (Note: `onChange` is still needed to catch character removal)
        isDirty.current = true;
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          if (value === sourceValue) {
            input?.blur();
          } else {
            flushSync(() => setValue(sourceValue));
            input?.select();
          }
        }

        if (event.key === 'Enter') {
          // Treat the value as dirty when the Enter key is pressed
          isDirty.current = true;
          input?.blur();
        }

        props.onKeyDown?.(event);
      }}
      onPointerDown={(event) => {
        handlePointerDown(input);
        props.onPointerDown?.(event);
      }}
    />
  );
}

function defaultFormatter(value: string) {
  return value;
}

function defaultParser(value: string) {
  return value.trim().replace(/\s+/g, ' ') || null;
}

/** Autoselects input contents on click */
export function handlePointerDown(input: HTMLInputElement | null) {
  if (document.activeElement !== input) {
    if (input) {
      // (1) Firefox restores previous selection on focus
      // (2) Chrome also restores previous selection, but only when it spans the entire value
      // This is at odds with autoselection on click; we want a clear initial state every time.
      input.focus(); // Required for Chrome only, as it won't modify selection unless focused.
      input.selectionStart = null;
      input.selectionEnd = null;
    }

    // If input selection changes at any point after pointerdown, we want to cancel autoselection
    // on pointerup (even if the user ends up with no selection after the cursor movement).
    const handleSelectionChange = () => {
      if (input?.selectionStart !== input?.selectionEnd) {
        document.removeEventListener('selectionchange', handleSelectionChange);
        document.removeEventListener('pointerup', handlePointerUp);
      }
    };

    const handlePointerUp = (event: Event) => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (event.target && event.target === input) {
        input.select();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('pointerup', handlePointerUp, { once: true, passive: true });
  }
}

export const baseInputProps = {
  'type': 'text',
  'autoCapitalize': 'none',
  'autoComplete': 'off',
  'autoCorrect': 'off',
  'spellCheck': 'false',
  // Turn off common password managers
  // https://www.stefanjudis.com/snippets/turn-off-password-managers/
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
} as const;

/**
 * Fix up floating-point arithmetic issues by applying a incredibly tiny rounding on the value.
 *
 * Example:
 * - `0.05 + 0.01 => 0.060000000000000005`
 * - `decimal(0.05 + 0.01) => 0.06`
 */
export function decimal(number: number) {
  return +number.toFixed(12);
}
