"""
	File name: example.py
	Authors: Adam Coscia
	Date created: 9/3/2020
	Date last modified: 9/3/2020
	Python Version: 3.8.1
	Execute: $ [python3.8] example.py
	Usage: Gives sample usage of `sparqlwrapper` and `pandas` for data analysis
    Resource: https://www.wikidata.org/wiki/Wikidata:SPARQL_tutorial
"""
import pandas as pd
from SPARQLWrapper import SPARQLWrapper, JSON


ENDPOINT_URL = "https://query.wikidata.org/sparql"
QUERY = """
SELECT ?child
WHERE
{
# ?child  father   Bach
  ?child wdt:P22 wd:Q1339.
}
"""
CONTACT = {
    'project-name': "TexCompare",
    'website': "https://github.com/AdamCoscia/CS7450-F20-Project",
    'email': "acoscia6@gatech.edu",
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
    #
    # parsed = {
    #   head: {
    #       vars: [var1, var2, ...]
    #   },
    #   results: {
    #       bindings: [
    #           0: {
    #               var1: {
    #                   value: ... ,
    #                   <other attr>
    #               },
    #               var2: {
    #                   value: ... ,
    #                   <other attr>
    #               }, ...
    #           },
    #           1: {
    #               var1: {
    #                   value: ... ,
    #                   <other attr>
    #               },
    #               var2: {
    #                   value: ... ,
    #                   <other attr>
    #               }, ...
    #           }, ...
    #       ]
    #   }
    # }

    # list of records, where each record is a dictionary
    data = parsed["results"]["bindings"]
    # full dataframe with key.value column names for all nested dictionaries per record
    df = pd.json_normalize(data)

    cols = parsed["head"]["vars"]  # columns from the SELECT part of the query
    # subset full dataframe for only the 'value' columns
    df = df[[f"{c}.value" for c in cols]]
    df.columns = cols  # remove the '.value' part

    print(df)  # view the results!


if __name__ == "__main__":

    main()
