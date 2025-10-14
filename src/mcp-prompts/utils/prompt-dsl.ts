// A DSL for Prompt Building

type WithGetter<T> = T | (() => T)
type UnwrapWithGetter<T> = T extends WithGetter<infer V> ? V : T
function unwrapWithGetter<T>(value: WithGetter<T>): T {
  if (typeof value === "function") {
    return (value as () => T)()
  }
  return value
}

export interface InformationMetadata {
  subject: string
  description: string
}
type InformationShape<InformationLiteralType, ValueType> = InformationMetadata & {
  type: InformationLiteralType
  value: WithGetter<ValueType>
}
const createFactory = <InformationLiteralType, ValueType>(type: InformationLiteralType) => {
  return (
    params: Omit<InformationShape<InformationLiteralType, ValueType>, "type">
  ): InformationShape<InformationLiteralType, ValueType> => {
    return {
      type,
      ...params,
    }
  }
}
type Information = AtomInformation | GroupInformation | LazyInformation
type AtomInformation = InformationShape<"atom", string>
type GroupInformation = InformationShape<"group", Information[]>
type LazyInformation = InformationShape<"lazy", Promise<Information>>

type InformationWithUnwrappedValue<T> = T extends InformationShape<unknown, infer V>
  ? Omit<T, "value"> & { value: UnwrapWithGetter<V> }
  : never

export const atom = createFactory<"atom", string>("atom") satisfies (
  ...args: any[]
) => AtomInformation
export const group = createFactory<"group", Information[]>("group") satisfies (
  ...args: any[]
) => GroupInformation

// TODO: Implement context offloading for lazy information
const lazy = createFactory<"lazy", Promise<Information>>("lazy") satisfies (
  ...args: any[]
) => LazyInformation

const map = <T>(
  information: Information,
  callbacks: {
    atom: (atom: InformationWithUnwrappedValue<AtomInformation>) => T
    group: (group: InformationWithUnwrappedValue<GroupInformation>) => T
    lazy: (lazy: InformationWithUnwrappedValue<LazyInformation>) => T
  }
): T => {
  const informationType = information.type
  switch (informationType) {
    case "atom":
      return callbacks.atom({
        ...information,
        value: unwrapWithGetter(information.value),
      })
    case "group": {
      return callbacks.group({
        ...information,
        value: unwrapWithGetter(information.value),
      })
    }
    case "lazy":
      return callbacks.lazy({
        ...information,
        value: unwrapWithGetter(information.value),
      })
    default:
      informationType satisfies never
      throw new Error(`Unhandled information type: ${informationType}`)
  }
}

export function informationToXml(root: Information, indent: number = 0): string {
  const indentStr = "  ".repeat(indent)

  return map(root, {
    atom: (atom) => {
      return `${indentStr}<${atom.subject} description="${atom.description}">\n${indentStr}  ${atom.value}\n${indentStr}</${atom.subject}>`
    },
    group: (group) => {
      const children = group.value.map((child) => informationToXml(child, indent + 1)).join("\n")
      return `${indentStr}<${group.subject} description="${group.description}">\n${children}\n${indentStr}</${group.subject}>`
    },
    lazy: (lazy) => {
      // Lazy information requires async resolution, which cannot be done in a sync function
      return `${indentStr}<${lazy.subject} description="${lazy.description}" type="lazy">\n${indentStr}  [Lazy content - requires async resolution]\n${indentStr}</${lazy.subject}>`
    },
  })
}
