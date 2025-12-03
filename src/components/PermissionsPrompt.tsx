import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

type PermissionsPromptProps = {
  missingPermissions: string[];
};

export const PermissionsPrompt = ({
  missingPermissions,
}: PermissionsPromptProps) => {
  if (!missingPermissions || missingPermissions.length === 0) {
    return null;
  }

  const handleOpenHealthConnect = async () => {
    // Open Health Connect app settings
    try {
      await Linking.openURL("package://com.google.android.apps.healthdata");
    } catch (err) {
      console.warn("Could not open Health Connect app:", err);
      // Fallback: open Android settings
      await Linking.openSettings();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <MaterialIcons name="health-and-safety" size={40} color="#EE0F55" />

        <Text style={styles.title}>Health Permissions Required</Text>

        <Text style={styles.description}>
          This app needs permission to read your health data from Google Health
          Connect:
        </Text>

        <View style={styles.permissionsList}>
          {missingPermissions.includes("Steps") && (
            <Text style={styles.permissionItem}>• Steps</Text>
          )}
          {missingPermissions.includes("Distance") && (
            <Text style={styles.permissionItem}>• Distance</Text>
          )}
          {missingPermissions.includes("FloorsClimbed") && (
            <Text style={styles.permissionItem}>• Floors Climbed</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleOpenHealthConnect}
        >
          <Text style={styles.buttonText}>Open Health Connect</Text>
        </TouchableOpacity>

        <Text style={styles.instructions}>
          1. Open Health Connect app{"\n"}
          2. Go to Settings{"\n"}
          3. Find "StepCounter" app{"\n"}
          4. Grant permission to read your data
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EE0F55",
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 8,
  },
  description: {
    color: "#AFB3BE",
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  permissionsList: {
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  permissionItem: {
    color: "#C3FF53",
    fontSize: 13,
    marginVertical: 4,
  },
  button: {
    backgroundColor: "#EE0F55",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  instructions: {
    color: "#AFB3BE",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
});
