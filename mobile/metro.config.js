const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Fix for react-native-css-interop/jsx-runtime resolution
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === "react-native-css-interop/jsx-runtime") {
        return {
            filePath: path.resolve(
                __dirname,
                "node_modules/react-native-css-interop/dist/runtime/jsx-runtime.js"
            ),
            type: "sourceFile",
        };
    }
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

// Ensure nativewind scans the actual CSS file where @tailwind directives live
module.exports = withNativeWind(config, { input: "./styles/global.css" });
