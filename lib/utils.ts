type ClassValue = string | number | false | null | undefined | ClassValue[];

function flattenClassValue(value: ClassValue): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(flattenClassValue);
  }

  return [String(value)];
}

export function cn(...inputs: ClassValue[]) {
  return inputs.flatMap(flattenClassValue).join(" ");
}
