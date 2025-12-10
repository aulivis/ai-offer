declare module 'swagger-ui-react' {
  import { Component } from 'react';

  export interface SwaggerUIProps {
    spec?: object | string;
    url?: string;
    [key: string]: unknown;
  }

  export default class SwaggerUI extends Component<SwaggerUIProps> {}
}

