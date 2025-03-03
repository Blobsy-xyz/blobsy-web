import type {JestConfigWithTsJest} from "ts-jest";

const config: JestConfigWithTsJest = {
    verbose: true,
    testEnvironment: "node",
    transform: {
        "^.+\\.ts?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    setupFiles: ["<rootDir>/test/jest.setup.ts"]
};

export default config;