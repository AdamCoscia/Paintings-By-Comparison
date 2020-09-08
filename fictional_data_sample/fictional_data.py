"""
	File name: marvel_data.py
        Created by: Adam Coscia
        Modified by: Rojin Aei
	Date created: 9/3/2020
        Date last modified: 9/7/2020
	Python Version: 3.7.1
	Execute: $ [python3.7] fictional_data.py
	Usage: fictional char dataset 
    Resource: https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial
"""
import pandas as pd
from SPARQLWrapper import SPARQLWrapper, JSON


ENDPOINT_URL = "https://query.wikidata.org/sparql"


QUERY =  """ 
SELECT ?name ?nameLabel ?pic ?givenName ?givenNameLabel ?familyName ?familyNameLabel 
       ?gender ?genderLabel ?occupation ?occupationLabel
       ?citizenship ?citizenshipLabel ?placeOfBirth ?placeOfBirthLabel ?dateOfBirth ?dateOfBirthLabel
       ?placeOfDeath ?placeOfDeathLabel ?dateOfDeath ?dateOfDeathLabel ?causeOfDeath ?causeOfDeathLabel
WHERE
{
    ?name wdt:P31 wd:Q15632617. # instance of  animated character
    #?name wdt:P31 wd:Q15632617. # fictional human
    # ?name wdt:P31 wd:Q88540085. # instance of anthropomorphic fish
    #?name wdt:P31 wd:Q3542731. #fictional animal character
    ?name wdt:P1441 wd:Q886. # presented in The simpson
    #?name wdt:P1441 wd:Q1396889 #animal farm
    #?name wdt:P1441 wd:Q1219561 #Around the World in Eighty Days
    #?name wdt:P5800 wd:Q215972.
    optional{?name wdt:P18 ?pic}.
    optional{?name wdt:P735 ?givenName}.
    optional{?name wdt:P734 ?familyName}.
    optional{?name wdt:P21 ?gender}.
    optional{?name wdt:P106 ?occupation}.
    optional{?name wdt:P27 ?citizenship}.
    optional{?name wdt:P19 ?placeOfBirth}.
    optional{?name wdt:P569 ?dateOfBirth}.
    optional{?name wdt:P20 ?placeOfDeath}.
    optional{?name wdt:P570 ?dateOfDeath.}
    optional{?name wdt:P509  ?causeOfDeath.}
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
"""

CONTACT = {
    'project-name': "TexCompare",
    'website': "https://github.com/AdamCoscia/CS7450-F20-Project",
    'email': "",
}

def main():
    """Queries SparQL endpoint and returns results as pandas DataFrame."""
    user_agent = f"User-Agent: {CONTACT['project-name']} ({CONTACT['website']}; {CONTACT['email']})"

    sparql = SPARQLWrapper(ENDPOINT_URL, agent=user_agent)
    sparql.setQuery(QUERY)
    sparql.setReturnFormat(JSON)
    results = sparql.query()

    url = results.geturl()  # url used to make the request
    print(f"HTTP Request: {url}")

    parsed = results.convert()  # results converted to dict following JSON format

    # list of records, where each record is a dictionary
    data = parsed["results"]["bindings"]
       

    # select the headers
    headers = ["name", "gender", "givenName","familyName" , "occupation", "citizenship", "placeOfBirth", "dateOfBirth", "placeOfDeath", "dateOfDeath","causeOfDeath"]
    new_headers = []
    for h in headers:
        new_headers += [h + ".value", h + "Label.value"]
    new_headers += ["pic.value"] 
    
    # transform and store the data and edit the header columns 
    df = pd.json_normalize(data)
    df = df[new_headers] 
    df.columns = df.columns.str.replace(".value", "")
    df.to_csv("fictional_data.csv")

if __name__ == "__main__":
    main()
