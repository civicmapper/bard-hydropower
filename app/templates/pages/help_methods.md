This tool uses a basic formula for estimating power generation potential; it is suitable for planning purposes only. The underlying elevation data driving the calculations is provided by the US Geological Survey through web service hosted by [ESRI](https://www.esri.com/en-us/home). Where available, head calculations rely on high resolution elevation data services hosted by the [NY State GIS Program Office](http://gis.ny.gov/elevation/DEM-web-services.htm).

[Current Hydro](http://www.currenthydro.com/) provides an overview of microhydropower technology on their website.

#### Variables

* `A` = area of the watershed upstream of the microhydropower installation, in `square miles`. This helps determine the volume of water that could pass through the turbine. This tool automatically determines this value from geospatial data (you have the option to override that).
* `H` = head (elevation change) for the microhydropower installation in `feet`; the drop in elevation helps determine how much energy the turbine will be able to generate. This tool automatically determines this value from geospatial data (you have the option to override that).
* `Y` = watershed yield, as `cubic feet per second per square mile` (`cfs/sqmi`). We use 1.6 cfs/sqmi as a constant as a general estimate of the amount of water per square mile a watershed will yield, which is good enough for planning purposes.
* `F` = an environmental flow constant, typically between 0.1 and 0.5 `cfs/sqmi`. Our default is 0.3.
* `E` = a power generation efficiency constant. Our default is 70%.
* `R` = electricity value per kilowatt-hour, in dollars
* `P` = power generated, in kilowatt-hours
* `V` = annual value of power generated, in dollars

#### Calculation

##### Estimate potential watershed yield

* `Qt = A * Y` This is how much water theoretically comes down the stream (cubic feet per second).
* `Qe = A * F` This is how much water is needed to maintain basic ecosystem function (cubic feet per second).
* `Qu = Qt - Qe` Useable yield from the watershed (cubic feet per second).

#### Calculate Power Generation

* `P = (Qu * H / 11.8) x e` power generated, in kilowatt-hours

#### Calculate Power Value

* `V = R * 8766 * P` annual value of power generated, in dollars
