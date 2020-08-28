/* Localization has to be set up before a call to nls.loadMessageBundle().
 * Because of the module evaluation order, modules that are imported get
 * evaluated before the ones that imported them. That's why this single
 * line of code is in its own module and HAS TO BE IMPORED FIRST in 
 * extension.ts
 */
import * as nls from "vscode-nls";

nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone });