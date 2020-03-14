import React, { FC } from 'react';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button';
import Icon from 'semantic-ui-react/dist/commonjs/elements/Icon';
import { SemanticICONS } from 'semantic-ui-react/dist/commonjs/generic.d';
import WideButton from './WideButton';

type LinkButton = {
  color: string;
  link?: string;
  icon?: SemanticICONS;
  iconElement?: JSX.Element;
  disable: boolean;
};

const LinkButton: FC<LinkButton> = ({
  link,
  color,
  icon,
  iconElement,
  disable = false,
  children
}) => {
  const button = (
    <WideButton color={color}>
      <Button icon basic disabled={disable}>
        {iconElement || <Icon name={icon} />}
        {children}
      </Button>
    </WideButton>
  );

  return link && !disable ? (
    <a href={link} target="_blank" rel="noopener noreferrer">
      ;{button}
    </a>
  ) : (
    button
  );
};

export default LinkButton;
