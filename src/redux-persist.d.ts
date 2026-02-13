declare module 'redux-persist/integration/react' {
    import { ReactNode, ComponentType } from 'react';
    import { Persistor } from 'redux-persist';

    /**
     * Properties for the PersistGate component
     */
    export interface PersistGateProps {
        /**
         * The persistor to wait for
         */
        persistor: Persistor;
        /**
         * UI to show while the state is being rehydrated
         */
        loading?: ReactNode;
        /**
         * Optional callback for when hydration is complete
         */
        onBeforeLift?(): void | Promise<void>;
        /**
         * Children to render
         */
        children?: ReactNode | ((bootstrapped: boolean) => ReactNode);
    }

    /**
     * PersistGate component for Redux-Persist
     */
    export const PersistGate: ComponentType<PersistGateProps>;
}
