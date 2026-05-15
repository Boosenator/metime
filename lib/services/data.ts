export { readServicesSync as SERVICES_LIST, getServiceSync as getService, getTopicSync as getTopic } from "./storage"
export { readServices, readServicesSync, saveServices } from "./storage"

// Backward-compat: synchronous SERVICES array (reads fresh from JSON each call)
import { readServicesSync } from "./storage"
export const SERVICES = readServicesSync()
