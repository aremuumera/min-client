import * as React from 'react';

import { DropdownContext } from './dropdown-context';

export function DropdownTrigger({ children }: any) {
  const { onTriggerMouseEnter, onTriggerMouseLeave, onTriggerKeyUp } = React.useContext(DropdownContext);

  return React.cloneElement(children, {
    onKeyUp: (event: any) => {
      children.props.onKeyUp?.(event);
      onTriggerKeyUp(event);
    },
    onMouseEnter: (event: any) => {
      children.props.onMouseEnter?.(event);
      onTriggerMouseEnter(event);
    },
    onMouseLeave: (event) => {
      children.props.onMouseLeave?.(event);
      onTriggerMouseLeave(event);
    },
  });
}
