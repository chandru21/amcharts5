import type { Exporting, ExportingFormats, ExportingTypes } from "./Exporting"
import exportingCSS from "./ExportingCSS";
import { Entity, IEntitySettings, IEntityPrivate, IEntityEvents } from "../../core/util/Entity"
import type { Template } from "../../core/util/Template";
import type { Root } from "../../core/Root"
import { IDisposer, Disposer } from "../../core/util/Disposer";
import * as $array from "../../core/util/Array";
import * as $utils from "../../core/util/Utils";

export interface IMenuItem {

	/**
	 * Indicates type of the menu item:
	 * * `"format"` - indicates export action
	 * * `"separator"` - will show horizontal divider.
	 * * `"custom"` - will invoke custom function when clicked.
	 */
	type: "format" | "separator" | "custom";

	/**
	 * If `type`` is set to `"format"`, clicking item will initiate export in
	 * that format.
	 */
	format?: ExportingFormats;

	/**
	 * Indicates export type: `"image"`, `"data"`, or `"print"`.
	 */
	exportType?: ExportingTypes;

	/**
	 * Menu label.
	 */
	label?: string;

	/**
	 * Additional information.
	 */
	sublabel?: string;

	/**
	 * If `type` is set to `"custom"`, this needs to be set to a function.
	 */
	callback?: (menuItem?: any) => any;

	/**
	 * A target for callback function.
	 */
	callbackTarget?: any;

	/**
	 * A DOM element for the menu item.
	 *
	 * @readonly
	 */
	element?: HTMLAnchorElement;

}

export interface IExportingMenuSettings extends IEntitySettings {

	/**
	 * Horizontal alignment of the menu.
	 *
	 * @default "right"
	 */
	align?: "left" | "right";

	/**
	 * Vertical alignment of the menu.
	 *
	 * @default "top"
	 */
	valign?: "top" | "bottom";

	/**
	 * A reference to an element in the document to place export menu in.
	 *
	 * If not set, will use root element's container.
	 */
	container?: HTMLElement;

	/**
	 * A list of menu items.
	 */
	items?: IMenuItem[];

	/**
	 * A reference to related [[Exporting]] object.
	 * @type {[type]}
	 */
	exporting?: Exporting;

	/**
	 * If set to `false` the legend will not load default CSS.
	 *
	 * @default true
	 */
	useDefaultCSS?: boolean;

	/**
	 * If set to `true` the menu will close automatically when export operation
	 * is initiated.
	 * 
	 * @default true
	 */
	autoClose?: boolean;

	/**
	 * Menu will disable all interactions for the underlying chart when browsing
	 * the menu.
	 * 
	 * @default true
	 */
	inactivateRoot?: boolean;

}

export interface IExportingMenuPrivate extends IEntityPrivate {
}

export interface IExportingMenuEvents extends IEntityEvents {
	"menucreated": {}
	"menuopened": {}
	"menuclosed": {}
}

/**
 * Displays a menu for [[Exporting]].
 *
 * @see {@link https://www.amcharts.com/docs/v5/concepts/exporting/} for more info
 */
export class ExportingMenu extends Entity {

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: ExportingMenu["_settings"], template?: Template<ExportingMenu>): ExportingMenu {
		const x = new ExportingMenu(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "ExportingMenu";
	public static classNames: Array<string> = Entity.classNames.concat([ExportingMenu.className]);

	declare public _settings: IExportingMenuSettings;
	declare public _privateSettings: IExportingMenuPrivate;
	declare public _events: IExportingMenuEvents;

	private _menuElement?: HTMLDivElement;
	private _iconElement?: HTMLElement;
	private _listElement?: HTMLUListElement;
	private _itemElements?: HTMLLIElement[] = [];

	private _cssDisposer?: IDisposer;
	private _activeItem?: IMenuItem;

	public isOpen: boolean = false;

	private _isOver: boolean = false;

	protected _afterNew() {
		super._afterNew();
		this._setRawDefault("container", this._root._dom);
		this._setRawDefault("align", "right");
		this._setRawDefault("valign", "top");
		this._setRawDefault("useDefaultCSS", true);
		this._setRawDefault("autoClose", true);
		this._setRawDefault("inactivateRoot", true);
		this._setRawDefault("items", [{
			type: "separator",
			label: this._root.language.translate("Export")
		}, {
			type: "format",
			format: "png",
			exportType: "image",
			label: this._root.language.translate("PNG"),
			sublabel: this._root.language.translate("Image")
		}, {
			type: "format",
			format: "jpg",
			exportType: "image",
			label: this._root.language.translate("JPG"),
			sublabel: this._root.language.translate("Image")
		}, {
			type: "format",
			format: "pdf",
			exportType: "image",
			label: this._root.language.translate("PDF"),
			sublabel: this._root.language.translate("Image")
		}, {
			type: "separator",
			exportType: "data",
			//label: this._root.language.translate("Data")
		}, {
			type: "format",
			format: "json",
			exportType: "data",
			label: this._root.language.translate("JSON"),
			sublabel: this._root.language.translate("Data")
		}, {
			type: "format",
			format: "csv",
			exportType: "data",
			label: this._root.language.translate("CSV"),
			sublabel: this._root.language.translate("Data")
		}, {
			type: "format",
			format: "xlsx",
			exportType: "data",
			label: this._root.language.translate("XLSX"),
			sublabel: this._root.language.translate("Data")
		}, {
			type: "format",
			format: "pdfdata",
			exportType: "data",
			label: this._root.language.translate("PDF"),
			sublabel: this._root.language.translate("Data")
		}, {
			type: "format",
			format: "html",
			exportType: "data",
			label: this._root.language.translate("HTML"),
			sublabel: this._root.language.translate("Data")
		}, {
			type: "separator"
		}, {
			type: "format",
			format: "print",
			exportType: "print",
			label: this._root.language.translate("Print")
		}]);

		const menuElement = document.createElement("div");
		this._menuElement = menuElement;

		const iconElement = document.createElement("a");
		this._iconElement = iconElement;

		this._listElement = document.createElement("ul");
		this._listElement.setAttribute("role", "menu");
		this._applyClassNames();

		iconElement.innerHTML = '<svg fill="none" height="20" width="20" xmlns="http://www.w3.org/2000/svg"><path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/></svg>';
		iconElement.setAttribute("tabindex", this._root.tabindex.toString());
		iconElement.setAttribute("aria-label", this._root.language.translate("Export"));
		iconElement.setAttribute("aria-description", this._root.language.translate("Press ENTER to open"));

		if ($utils.supports("keyboardevents")) {
			this._disposers.push($utils.addEventListener(document, "keydown", (ev: KeyboardEvent) => {
				if (document.activeElement == this._iconElement || this.isOpen) {
					if (ev.keyCode == 27) {
						// ESC
						this.close();
					}
					else if (ev.keyCode == 13) {
						// ENTER
						if (this._activeItem) {
							this._handleClick(this._activeItem);
						}
						else {
							this.toggle();
						}
					}
					else if (ev.keyCode == 38 || ev.keyCode == 40) {
						const items = this.get("items", []);
						let currentIndex = (<any>items).indexOf(this._activeItem);
						if (this.get("valign") == "top" && currentIndex == -1) {
							currentIndex = items.length;
						}
						const dir = ev.keyCode == 38 ? -1 : 1;
						let newIndex = currentIndex + dir;
						let newItem;
						do {
							if (newIndex < 0) {
								newIndex = items.length - 1;
							}
							else if (newIndex > (items.length - 1)) {
								newIndex = 0;
							}
							if (items[newIndex].type == "separator") {
								newIndex += dir;
							}
							else {
								newItem = items[newIndex];
							}
						} while(!newItem);

						if (newItem) {
							this._handleItemFocus(newItem);
						}
					}
				}
			}));
		}

		iconElement.addEventListener("click", (ev: MouseEvent) => {
			ev.stopImmediatePropagation();
			this.toggle();
		});

		menuElement.appendChild(this._iconElement);
		menuElement.appendChild(this._listElement);

		this._root._dom.appendChild(this._menuElement);

		menuElement.addEventListener($utils.getRendererEvent("pointerover"), (_ev) => {
			this._isOver = true;
			if (this.get("inactivateRoot")) {
				this._root._renderer.interactionsEnabled = false;
			}
		});

		menuElement.addEventListener($utils.getRendererEvent("pointerout"), (_ev) => {
			this._isOver = false;
			if (this.get("inactivateRoot")) {
				this._root._renderer.interactionsEnabled = true;
			}
		});

		this._disposers.push(new Disposer(() => {
			if (this._menuElement) {
				this._root._dom.removeChild(this._menuElement);
			}
		}));

		this._disposers.push($utils.addEventListener(document, "click", (_ev) => {
			if (!this._isOver) {
				this.close();
			}
		}));

		this.loadDefaultCSS();

		this._root.addDisposer(this);

		this.events.dispatch("menucreated", {
			type: "menucreated",
			target: this
		});
	}

	public _beforeChanged() {
		super._beforeChanged();

		if (this._itemElements!.length == 0) {
			this.createItems();
		}

		if (this.isDirty("useDefaultCSS")) {
			if (this.get("useDefaultCSS")) {
				this.loadDefaultCSS();
			}
			else if (this._cssDisposer) {
				this._cssDisposer.dispose();
			}
		}

		if (this.isDirty("exporting")) {
			const exporting = this.get("exporting");
			if (exporting) {
				this.createItems();
			}
		}

		if (this.isDirty("align") || this.isDirty("valign")) {
			this._applyClassNames();
		}

		if (this.isDirty("container")) {
			const container = this.get("container");
			if (container) {
				container.appendChild(this._menuElement!);
			}
		}
	}

	private _applyClassNames(): void {
		const align = this.get("align", "right");
		const valign = this.get("valign", "top");
		const status = this.isOpen ? "am5exporting-menu-open" : "am5exporting-menu-closed";

		this._menuElement!.className = "am5exporting am5exporting-menu am5exporting-align-" + align + " am5exporting-valign-" + valign + " " + status;
		this._iconElement!.className = "am5exporting am5exporting-icon am5exporting-align-" + align + " am5exporting-valign-" + valign;
		this._listElement!.className = "am5exporting am5exporting-list am5exporting-align-" + align + " am5exporting-valign-" + valign;
	}

	public createItems(): void {
		const exporting = this.get("exporting");
		if (!exporting) {
			return;
		}
		this._listElement!.innerHTML = "";
		this._itemElements = [];
		const items = this.get("items", []);
		const supportedFormats = exporting.supportedFormats();
		const supportedExportTypes = exporting.supportedExportTypes();

		$array.each(items, (item) => {

			if (item.format && supportedFormats.indexOf(item.format) == -1) {
				return;
			}

			if (item.exportType && supportedExportTypes.indexOf(item.exportType) == -1) {
				return;
			}

			const li = document.createElement("li");
			li.setAttribute("role", "menuitem");

			li.className = "am5exporting am5exporting-item am5exporting-type-" + item.type;
			if (item.format) {
				li.className += " am5exporting-format-" + item.format;
			}

			const a = document.createElement("a");

			let ariaLabel = this._root.language.translate("Export");
			if (item.label) {
				a.innerHTML = item.label;
				ariaLabel += " " + item.label;
			}

			if (item.sublabel) {
				a.innerHTML += " <span class=\"am5exporting-label-alt\">" + item.sublabel + "</span>";
				ariaLabel += " (" + item.sublabel + ")";
			}

			if (item.callback) {
				a.addEventListener("click", (_ev) => {
					item.callback!.call(item.callbackTarget || this)
				});
				a.setAttribute("tabindex", this._root.tabindex.toString());
			}
			else if (item.format && exporting) {
				a.addEventListener("click", (_ev) => {
					this._handleClick(item);
				});
				a.addEventListener("focus", (_ev) => {
					this._handleItemFocus(item);
				});
				a.addEventListener("blur", (_ev) => {
					this._handleItemBlur(item);
				});
				a.setAttribute("tabindex", this._root.tabindex.toString());
				a.setAttribute("aria-label", ariaLabel);
			}

			item.element = a;
			li.appendChild(a);
			this._listElement!.appendChild(li);
			this._itemElements!.push(li);
		});
	}

	private _handleClick(item: IMenuItem): void {
		const exporting = this.get("exporting")!;
		if (this.get("autoClose")) {
			this.close();
		}
		if (item.format == "print") {
			exporting.print();
		}
		else {
			exporting.download(item.format!);
		}
	}

	private _handleItemFocus(item: IMenuItem): void {
		if (item != this._activeItem) {
			if (this._activeItem) {
				this._activeItem.element!.className = "";
			}
			this._activeItem = item;
			item.element!.className = "am5exporting-item-active";
			item.element!.focus();
		}
	}

	private _handleItemBlur(item: IMenuItem): void {
		item.element!.className = "";
		if (item == this._activeItem) {
			this._activeItem = undefined
		}
		this.setTimeout(() => {
			if (!document.activeElement || !$utils.contains(this.get("container")!, document.activeElement!)) {
				this.close();
			}
		}, 10);

	}

	/**
	 * Loads the default CSS.
	 *
	 * @ignore Exclude from docs
	 */
	public loadDefaultCSS(): void {
		const disposer = exportingCSS($utils.getShadowRoot(this._root._dom), this._root);
		this._disposers.push(disposer);
		this._cssDisposer = disposer;

		// if (this._element) {
		// 	this._element.style.display = "";
		// }
	}

	public open(): void {
		this.isOpen = true;
		this._applyClassNames();
		this.events.dispatch("menuopened", {
			type: "menuopened",
			target: this
		});
	}

	public close(): void {
		this.isOpen = false;
		$utils.blur();
		this._applyClassNames();
		this.events.dispatch("menuclosed", {
			type: "menuclosed",
			target: this
		});
	}

	public toggle(): void {
		if (this.isOpen) {
			this.close();
		}
		else {
			this.open();
		}
	}


}