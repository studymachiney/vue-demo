module.exports = {
    preset: 'ts-jest', // preset
    testEnvironment: 'node', // node环境
    moduleNameMapper: {
        '^@vue/(.*?)$': '<rootDir>/packages/$1/src'
    }
}
