import pandas as pd
import glob
import os

os.makedirs("build", exist_ok=True)

data = None

for file in glob.iglob("*.csv"):
    with open(file) as f:
        if data is None:
            data = pd.read_csv(file)
        else:
            data = pd.concat((data, pd.read_csv(file)))


del data[data.columns[0]]

data["id"] = data["artwork"].apply(lambda x: x.split("/")[-1])

data["width"] = data["widthLabel"].apply(lambda x: x.strip("[]"))
data["height"] = data["heightLabel"].apply(lambda x: x.strip("[]"))
del data["widthLabel"]
del data["heightLabel"]

data = data.rename(
    columns={
        "inceptionLabel": "year" ,
        "movementLabel": "movement",
        "creatorCountryLabel": "creatorCountry",
        "depictLabel": "depicts",
        "artwork": "wikidataUrl"
    }
)


for col in [
    "locatedLabel",
    "endTime",
    "countryLabel",
    "instanceOfLabel",
    "num_creators",
    "genderLabel",
]:
    del data[col]


print(data.columns)

data.to_csv("build/data-to-visualize.csv")
