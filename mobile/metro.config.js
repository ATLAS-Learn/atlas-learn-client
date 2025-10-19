const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Ensure nativewind scans the actual CSS file where @tailwind directives live
module.exports = withNativeWind(config, { input: "./styles/global.css" });
