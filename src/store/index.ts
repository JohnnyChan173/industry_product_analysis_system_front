import { createPinia } from "pinia";
import { useUserInfoStore, useUserRoutesStore } from "./modules/user";
import { useAppStore } from "./modules/app";
import { useDataStore } from "./modules/data";
import { usePrintStore } from "./modules/print";
import { useStationStore } from "./modules/station";

const pinia = createPinia();

export { pinia as default, useUserInfoStore, useUserRoutesStore, useAppStore, useDataStore, usePrintStore, useStationStore };
