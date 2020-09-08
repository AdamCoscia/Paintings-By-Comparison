"""
	File name: marvel_data.py
        Created by: Adam Coscia
        Modified by: Rojin Aei
	Date created: 9/3/2020
        Date last modified: 9/7/2020
	Python Version: 3.7.1
	Execute: $ [python3.7] marvel_data.py
	Usage: marvel dataset 
    Resource: https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial
"""
import pandas as pd
from SPARQLWrapper import SPARQLWrapper, JSON


ENDPOINT_URL = "https://query.wikidata.org/sparql"


QUERY =  """ SELECT ?name ?nameLabel ?pic ?gender ?genderLabel ?ability ?abilityLabel 
       ?occupation ?occupationLabel ?citizenship ?citizenshipLabel 
       ?placeOfBirth ?placeOfBirthLabel ?dateOfBirth ?dateOfBirthLabel
       ?unmarriedPartner ?unmarriedPartnerLabel 
       ?spouse ?spouseLabel ?father ?fatherLabel
       ?sibling ?siblingLabel ?child ?childLabel ?creator ?creatorLabel 
       ?enemyOf ?enemyOfLabel
       ?derivativeWork ?derivativeWorkLabel 
WHERE
{
    ?name wdt:P31 wd:Q1114461 . # ?name    instance of     comics character
    ?name wdt:P1080 wd:Q931597. # from narrative universe
    optional{?name wdt:P18 ?pic}.
    ?name wdt:P21 ?gender.
    ?name wdt:P2563 ?ability.
    ?name wdt:P106 ?occupation.
    optional{?name wdt:P27 ?citizenship}.
    ?name wdt:P19 ?placeOfBirth.
    optional{?name wdt:P569 ?dateOfBirth}.
    optional{?name wdt:P451 ?unmarriedPartner}.
    optional{?name wdt:P26 ?spouse}.
    optional{?name wdt:P22 ?father}.
    optional{?name wdt:P3373 ?sibling}.
    optional{?name wdt:P40 ?child}.
    optional{?name wdt:P170 ?creator}.
    optional{?name wdt:P7047 ?enemyOf}.
    optional{?name wdt:P4969 ?derivativeWork}.
    SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
limit 500 """

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
    headers = ["name", "gender", "ability", "occupation", "citizenship", "placeOfBirth", "dateOfBirth", 
               "unmarriedPartner", "spouse","father","sibling","child", "creator", "enemyOf", "derivativeWork"]
    new_headers = []
    for h in headers:
        new_headers += [h+".value",h+"Label.value"]
    new_headers += ["pic.value"] 
    
    # save the data and edit the header columns 
    df = pd.json_normalize(data)
    df = df[new_headers] 
    df.columns = df.columns.str.replace(".value", "")
    df.to_csv("marvel_data.csv")

if __name__ == "__main__":
    main()
