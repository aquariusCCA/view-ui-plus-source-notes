import type { DefineComponent } from 'vue'

export type IconBaseProps = {
  size?: number
  color?: string
}

export type IconProps = IconBaseProps & (
  | { type: string; custom?: never }
  | { type?: never; custom: string }
)

export declare const Icon: DefineComponent<IconProps, {}, any>
