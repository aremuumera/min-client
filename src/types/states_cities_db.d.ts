declare module 'states-cities-db' {
    export interface Country {
        name: string;
        iso: string;
        prefix: string;
    }

    export function getCountries(): Country[];

    const sc: {
        getCountries: typeof getCountries;
    };

    export default sc;
}
