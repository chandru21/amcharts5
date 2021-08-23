import { MapSeries, IMapSeriesSettings, IMapSeriesDataItem, IMapSeriesPrivate } from "./MapSeries";
import { MapLine } from "./MapLine";
import type { IMapPointSeriesDataItem } from "./MapPointSeries";
import type { Root } from "../../core/Root";
import * as $array from "../../core/util/Array";
import type { DataItem } from "../../core/render/Component";
import { ListTemplate } from "../../core/util/List";
import { Template } from "../../core/util/Template";

/**
 * @ignore
 */
export interface IMapLineSeriesPrivate extends IMapSeriesPrivate {
}

export interface IMapLineSeriesDataItem extends IMapSeriesDataItem {

	/**
	 * Related [[MapLine]] object.
	 */
	mapLine?: MapLine;

	/**
	 * GeoJSON geometry of the line.
	 */
	geometry?: GeoJSON.LineString | GeoJSON.MultiLineString;

	/**
	 * An array of data items from [[MapPointSeries]] to use as line end-points.
	 */
	pointsToConnect?: Array<DataItem<IMapPointSeriesDataItem>>;

}

export interface IMapLineSeriesSettings extends IMapSeriesSettings { }

/**
 * Creates a map series for displaying lines on the map.
 *
 * @see {@link https://www.amcharts.com/docs/v5/getting-started/map-chart/map-line-series/} for more info
 * @important
 */
export class MapLineSeries extends MapSeries {

	/**
	 * @ignore
	 */
	public makeMapLine(dataItem: DataItem<this["_dataItemSettings"]>): MapLine {
		const mapLine = this.children.push(this.mapLines.make());
		mapLine._setDataItem(dataItem);
		this.mapLines.push(mapLine);
		return mapLine;
	}

	/**
	 * A [[ListTemplate]] of all lines in series.
	 *
	 * `mapLines.template` can also be used to configure lines.
	 *
	 * @default new ListTemplate<MapLine>
	 */
	public readonly mapLines: ListTemplate<MapLine> = new ListTemplate(
		Template.new({}),
		() => MapLine.new(this._root, {}, this.mapLines.template)
	);

	/**
	 * Use this method to create an instance of this class.
	 *
	 * @see {@link https://www.amcharts.com/docs/v5/getting-started/#New_element_syntax} for more info
	 * @param   root      Root element
	 * @param   settings  Settings
	 * @param   template  Template
	 * @return            Instantiated object
	 */
	public static new(root: Root, settings: MapLineSeries["_settings"], template?: Template<MapLineSeries>): MapLineSeries {
		const x = new MapLineSeries(root, settings, true, template);
		x._afterNew();
		return x;
	}

	public static className: string = "MapLineSeries";
	public static classNames: Array<string> = MapSeries.classNames.concat([MapLineSeries.className]);

	declare public _settings: IMapLineSeriesSettings;
	declare public _privateSettings: IMapLineSeriesPrivate;
	declare public _dataItemSettings: IMapLineSeriesDataItem;

	protected _types: Array<GeoJSON.GeoJsonGeometryTypes> = ["LineString", "MultiLineString"];

	/**
	 * @ignore
	 */
	public markDirtyProjection() {
		$array.each(this.dataItems, (dataItem) => {
			let mapLine = dataItem.get("mapLine");
			if (mapLine) {
				mapLine.markDirtyProjection();
			}
		})
	}

	protected processDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.processDataItem(dataItem);

		const mapLine = this.makeMapLine(dataItem);
		if (mapLine) {
			dataItem.set("mapLine", mapLine);
			const pointsToConnect = dataItem.get("pointsToConnect");
			if (pointsToConnect) {
				$array.each(pointsToConnect, (point) => {
					point.on("longitude", () => {
						this._markDirtyValues(dataItem);
					})

					point.on("latitude", () => {
						this._markDirtyValues(dataItem);
					})

					point.on("geometry", () => {
						this._markDirtyValues(dataItem);
					})
				})
			}

			mapLine.setPrivate("series", this);
		}
	}

	public _markDirtyValues(dataItem: DataItem<this["_dataItemSettings"]>) {
		if (dataItem) {
			if (dataItem.isDirty("value")) {
				super._markDirtyValues();
			}

			const mapLine = dataItem.get("mapLine");
			if (mapLine) {
				const pointsToConnect = dataItem.get("pointsToConnect");
				if (pointsToConnect) {
					let coordinates: Array<Array<number>> = [];
					$array.each(pointsToConnect, (point) => {
						coordinates.push([point.get("longitude", 0), point.get("latitude", 0)]);
					})

					mapLine.set("geometry", { type: "LineString", coordinates: coordinates });
				}
				else {
					mapLine.set("geometry", dataItem.get("geometry"));
				}
			}
		}
		else {
			super._markDirtyValues();
		}
	}

	/**
	 * @ignore
	 */
	public disposeDataItem(dataItem: DataItem<this["_dataItemSettings"]>) {
		super.disposeDataItem(dataItem);
		const mapLine = dataItem.get("mapLine");
		if (mapLine) {
			this.mapLines.removeValue(mapLine);
			mapLine.dispose();
		}
	}
}