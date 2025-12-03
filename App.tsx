import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import AntDesign from "@expo/vector-icons/AntDesign";

import Value from "./src/components/value";
import RingProgress from "./src/components/RingProgress";
import { PermissionsPrompt } from "./src/components/PermissionsPrompt";
// import useHealthData from './src/hooks/useHealthData';
import useStepsCombined from "./src/hooks/useStepsCombined";

console.log("[App] Module loading...");

export default function App() {
  console.log("[App] Rendering App component...");

  // Selected date
  const [date, setDate] = useState(new Date());

  // Health data hook
  const data = useStepsCombined(date);

  const {
    totalSteps,
    dailySteps,
    liveSteps,
    distance,
    flights,
    missingPermissions = [],
  } = data || {
    totalSteps: 0,
    dailySteps: 0,
    liveSteps: 0,
    distance: 0,
    flights: 0,
    missingPermissions: [],
  };

  // Show permissions prompt if any permissions are missing
  if (missingPermissions && missingPermissions.length > 0) {
    return <PermissionsPrompt missingPermissions={missingPermissions} />;
  }

  console.log(
    `Steps: ${totalSteps} | Distance: ${distance}m | Flights: ${flights}`
  );

  // Change the selected date
  const changeDate = (numDays: number) => {
    const updatedDate = new Date(date);
    updatedDate.setDate(updatedDate.getDate() + numDays);
    setDate(updatedDate);
  };

  return (
    <View style={styles.container}>
      {/* Date Picker Row */}
      <View style={styles.datePicker}>
        <AntDesign
          onPress={() => changeDate(-1)}
          name="left"
          size={20}
          color="#C3FF53"
        />

        <Text style={styles.date}>{date.toDateString()}</Text>

        <AntDesign
          onPress={() => changeDate(1)}
          name="right"
          size={20}
          color="#C3FF53"
        />
      </View>

      {/* Progress Ring */}
      <RingProgress progress={totalSteps / 10000} />

      {/* Values Section */}
      <View style={styles.values}>
        <Value label="Steps" value={totalSteps.toString()} />
        <Value label="Distance" value={(distance / 1000).toFixed(2) + " km"} />
        <Value label="Flights Climbed" value={flights.toString()} />
      </View>

      {/* Data Source Info */}
      {/* <View style={styles.dataSourceInfo}>
        <Text style={styles.dataSourceText}>
          📊 Steps: {liveSteps > 0 ? "Live (Pedometer)" : "HC"} | Distance &
          Flights: Health Connect
        </Text>
      </View> */}

      <StatusBar style="auto" />
    </View>
  );
}

// -------- Styles -------- //
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },

  datePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 20,
  },

  date: {
    color: "white",
    fontSize: 16,
  },

  values: {
    flexDirection: "row",
    gap: 25,
    flexWrap: "wrap",
    marginTop: 30,
  },

  // dataSourceInfo: {
  //   marginTop: 20,
  //   paddingHorizontal: 10,
  // },

  // dataSourceText: {
  //   color: "#888",
  //   fontSize: 11,
  //   textAlign: "center",
  // },
});
