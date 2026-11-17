"""Images a Teams card carries inline, written by tools/teams_brand_images.mjs: do not edit.

A card carries its own images because the service has no public address for Teams to fetch
them from. Drawn at twice their shown size from docs/design/mockups/teams-cards.html: ``BAND``
is the navy field with the symbol's wave (shown behind the header), ``LOCKUP`` the symbol
tile and the app name (shown 28px high), ``PILLS`` and ``SHAPES`` each run state's
badge (22px high) and shape (10px), ``ICONS`` the meta icons (14px)."""

from collections.abc import Mapping
from types import MappingProxyType

LOCKUP = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAOwAAAA4CAMAAADJouQfAAAAt1BMVEUAAAAAEf8AEf8AEf8AEf8AEf8AIv8AIv8A"
    "Ef8AIv8AIv8AEf8AIv8AEf8AEf8AEf8AEf8AIv8AEf8RM/9VZv+Imf+7zP/MzP/d3f/u7v+Zmf////8iM///////"
    "//////////+qqv/u///M3f+7u/+Zqv+IiP////////////8zRP93iP9md/8zVf8RIv////////8iRP//////////"
    "//////////+qu/9EVf9mZv/d7v8AIv8AIv8b7SRAAAAAPXRSTlMARIi73e7/iGbdVVXu/zPMEZmZ////////////"
    "/yJmiFX///////9EzBH//////zN3/+6Zqt27/////8wzcUqetgAABUBJREFUeNrlm+t2mzgQgJWL3Ta3dmuc2GWF"
    "SGtXku01KkjE2ez7P9ceQMAIhLn4JOeQzK8EY2m+uWkkMEK5nJ1fXE6mR2RyefHpDL0H+fxl2km+fB496lVH1BT3"
    "etys1zfTHjK5GjXr7bSX3I7Yt3c3055yczda2Mtpb/k62jo8HSAjrcnfJkNgJ98+jmPH6tq/hsF+HyXsxTDYi3db"
    "i2fO/P5hsVzCPmqUsO2gPxauFrjUvj/Yv+cFaAV2+t5gnXvXlLeGxR7x3wTWefwJOX+tHte/3xiWJhMz/sqwm+0K"
    "kC4fd//sa/ccHZTTYLiOJJmUIIRYOr1ouz+g2BoWlutmNfqzcearJfDoYruxe7459gQLk2+GzDsRNh3GjY7d60uV"
    "zUUCw9gi1joQ3ATrVuXp0JjQTT6NwdeVdxJsypH+lQzsRbR6pwjBZKzE9RW4LnkX2NVuf6R6NaSZMscQp8CK1Dmp"
    "a0Qyrn/ErnAyal4GWW+H/fn0vD++/tpDOHTdk2kL2ARR+yvlqsCyWiBmgcS1EiELq7R12OX93Gnvqqx6ZvOHxOeY"
    "al3wCbClWGCJjlIv4FRkAaWjILue/I1j1xgMAmx3z85h1q05tqmZTaMCqI1RXzCluZV5QIOKIXiQftoNNjAih2em"
    "jYt7GQJeZl3bxT6wyvRlZlaelVWFsAxzChxpV5Ayn0h6SZESNuVRCPlloJamiypZwoq5GbyRuK6SwgZ7aJEW2KCi"
    "T/o/oxo2CAv1/DK1mTYNLqqN7AYb6g+LCuway7PSVgw83HXp6dcuRtUklYQWiqm4KCIeHFNhEAUZfxdYCioScG1C"
    "L7OIDlo6qBNhYyM/gMAaTbWeMuDZchiD1SKMpF67ICxlWV1VjAmzPNULBi9tqSIveD1YVuhuh2U+5gHPbpNl+aCF"
    "Y6Ny9YSwtgKVRlEIJ/HMpNXWkx5/HVjV1N0ZfV8Agl3o69wtDKAt0AYrKymbBwctS3PO69lhTyxQqtTYAqtguGn/"
    "Yx34QaFo7rROnrXApoHLidHIEfQKS098NIyJEYAsEx2MPsxA0QW2nrNenrNZfPiyrBR+P9j9wXnebVtg66EFYamx"
    "+kLRfAouIm2wXq09q+NjoeM57g47c348dMpZUlVAUACLG2H5AFi/1nkzMAbPJ9OLezfYvbNedC5Q1NJUpBvNEAaY"
    "tJQxH9bWTmGclTRVnVwmZzlSlWkqykw+DjvbrfqdQWUbaW6EtUsrsMSS2UaBkl1g9eC+WTCSIZQxvtcJdr+777v0"
    "aDPGHM7DUAWWgmDHISN+8gGICdxpndVxHOprPCo8HRm9lWwP483WIF2u5s7mz6x9i5eZlyUnUHr6dFYDFvYeRc+e"
    "fjGk3ZuKHMPY4qWxobdDEQfmb4KdHbZP8BDK/Xe+OWHzHqMabKYNE34UFk6muebE0i7mZDEhoCLx2lw6NKK8XWQM"
    "2KAGO396WJpfv286b2s6lgktrBVYcyOgKyqo0bamguQAMNGVlbXSQDU2FeY9y7Wz73sGhbChgUQ2WLjFyzXBhYaS"
    "WmBzN6rmQ6iwiHIujeuitTderp0BxzLpKWaBG2Fkh0U4j9aYVjQPBbLBIpxthyotCy1wQ+PMFJM4tw5p288+zA+t"
    "75AcO8n3BBF+yzE59gkRQeWK6P20A/uCEOH51glEdY8HH1kuF6v1b2fT6dWvUT7Y+vqRHkZ/HwZ7PkrYs2GwI33t"
    "62UI68s4WdHVENjRvqv58nEc+8Fe1ETXPVlvR/169VWv9xdvRv5Dgf/6vDZ/h8YuH+gHEWl38an9py7n447g/wE8"
    "4YbEjo1lCwAAAABJRU5ErkJggg=="
)

BAND = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAABQIAAABwCAMAAABy1f2eAAAAGFBMVEUAADMAEYgAEXcAEWYAAET///8AEVUAAFVv"
    "xP4LAAAACHRSTlP///////////OBUtQAAAIoSURBVHja7dxRCsIwFABBTaq9/40lIiLor6DdmSukLK9J2tMJ+Irz"
    "/xtzO/YaXS6eU5DAz/27bodfIwkECfzYvz2xRhIIEljtnwSCBL6Ze2iNJBAkMDn/SSBIYLt/EggSGO6fBIIEhvsn"
    "gSCBsfMPCQQJDH3+IYEggcY/CQQJNP5JIEjgOv3QPwmEZgKNfxII0QQWfv4igSCBLv9JIEig3T8JhHoCHf5KIFQT"
    "6O6fBEI0gTb/JBCiCZw2/yQQmgmUPwmEaALt/UkgRBMofxIIzQT67EMCoZlAt54lEJoJVD8JhGQCh1NfCYRkAtVP"
    "AiGZwDEdekggFBNo9JNACCZwrPaJnwRCLIFjmvskEGoJHCt92ieBkErget/1wiuB0EngWAPf3JVPAuGYxsN8cU+e"
    "5kkggAQCSCCABAJIIIAEAkgggAQCSCCABAJIIIAEAkgggAQCSCCABAJIIIAEAkgggAQCEggggQASCCCBABIIIIEA"
    "EggggQASCCCBABIIIIHA08bPk0D4mjM/TwJBAiUQkEAJBCRQAgEJlEBAAiUQkEAJBCRQAgEJlEBAAiUQkEAJBCRQ"
    "AgEJlEBAAiUQJBAJBAlEAkECkUCQQCQQJBAJBAlEAkECkUCQQCQQJBAJBAlEAkECkUCQQCQQJBAJBAlEAkECkUCQ"
    "QCQQJBAJBAlEAkECkUCQQCQQJBAJBAlEAkECkUCQQAmUQJBACQQkUAIBCZRAQAIjCbwBOixk5B1puhgAAAAASUVO"
    "RK5CYII="
)

_PILL_queued = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAJwAAAAsCAMAAACnrCEKAAAAn1BMVEUAAADMzN3MzN3MzN3MzN3MzN3MzN3MzN3M"
    "zN3d3d3d7u7u7u7M3d3MzN3M3d3d3e7MzN3M3d3MzN3M3d3d3d3M3d3M3d3MzMyqqqqIiJl3d3e7u7uIiIhmZmZ3"
    "iIhERFWZmapmZndVVVVEVVVmd3eqqruZmZmqu7tVZmaImZl3d4iZqqpVVWa7zMy7u8zMzN3M3d3M3d3M3d3d3d3M"
    "zN2B2anQAAAANXRSTlMAM3eZu93u/1X///8zzP//ZneIiCIiRP///////////////////////////////6pmVRER"
    "InP50acAAANzSURBVHjazZnbeqIwEICjItMYD7XdFgjMTgFNrdW63e37P9t+CagJJ/dircyNxkH9mXMCYxUZDEfe"
    "2IdvFn/sjYYD1ilD79uxHERv2Ip2NwYAPhE3kgkHgPFdI9p0BjBfiJvKYg7gTets9wDzibi5TOYA97VoA+CiF8IB"
    "li7bA4Doi0wAHl2fzkWPZG57dtojuxkBONW8H37P2IQA/6mE8/qSC3ZWeAXbc//YNN2zgZs1ODUIIymjMGj5ZhyG"
    "cXBlx85M06objidYStJgVP6TjMj/hJcQvTSZ7s5EXLUxxCmeJI1rt5RRKXl8RThhoq5WRmJEXK0D7VtNWSHgmi2K"
    "Y6Vfg2vCQUM68BQxOjbiCDF19ZIoM0wcifCKcDolHqAyiSRnNiFEhJg4mUJEpS15+VZKaZZSFle+yk2OSWHULp3g"
    "EWbp26QFbgGPzKt4FRBX9nqFaF+hLHMlRPqviajE3pSmNaLEBV0ZvJttM5wOumoheUUM7fW7G3Wy/GUTnERZDWBL"
    "tHs3ERlf0KHOeGV4X1qKybgCpxD39voDUVlLPHm18GsVICDKeAG+6dbFZVSoVrhxLVklohOEHFFay4xob8PxCoAi"
    "KqJrZ3K5QxcVQWF+shnOZ34dzv3AhdtcsJzUrtJSXNihOwWIbIerujVCdKpX4CSvWF2IuZTOEnbqUnNBeynRbq0m"
    "RIi4ttdrN0HKbA1VKI6OabaOUiro1F223IwdKnB7143azXaCQBHGAVHIc6L1Ga4I88SybLcuIdoeI7AZ7lAvwlsn"
    "PSPEraP+WXSIkPJjhyhzJDnm4M7YKtsh79Sti3QyWdvcIYZs2tW+RL196RulKA5MBTU2TYmyME6oKB4aeW9qmezW"
    "TTKjU3kr3IDV0tVu/Kt64xd8d4rq+JgXWpLcAPDj0LLj/6bLWzoE+IyxQ+fItKqPRVwZvCyj0sBxRpQnIitaFE80"
    "QvbGL+t0j9gF7y1wh+Yp3Ro2m88nYB1+6DsPTy5wvx9w2z0duiC4MKfXp009iCspVdy9uVirlyuO6V65a+3Vjvq4"
    "rx70eGt4KPetTz4s+sW2OG+q2aDHxxGM/erxQQ5jyz7ZDqByNPzZp8PDz9qRsN8POg5+w5H/71EPjMcBRn+az9M9"
    "gPkN+bg+S/9qfRIxXc5u+ZBkNpx2P8T5Wt7q8dLyqcryF0FhWSkkullFAAAAAElFTkSuQmCC"
)

_SHAPE_queued = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAMAAAC+oj0CAAAADFBMVEUAAABVVVVVVVVVVVWH3s5DAAAABHRSTlMA"
    "Var/oA4xLwAAAGBJREFUeNp1UdEOACEIEvj/f765rJOavNSYgmJEAaREIgxUgY2EGmAsEAF0vvem2vnRXLglunvJ"
    "wO2zHP/Tx+Jq8h0WMdCDyEAPA4budXQiseVxR8U3wifY6QzZkALnZh+bvAHLJxmJIgAAAABJRU5ErkJggg=="
)

_PILL_running = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAKIAAAAsCAMAAADRlpOBAAAAw1BMVEUAAAC7u/+qu/+qu/+qu/+qu/+qu/+qu/+q"
    "u/+7u/+7u/+qu/+qu/+7zP/MzP/d3f/d7v+7u/+7u/+7u/+qu/+qu/+qu//M3f+qu/+Zqv9md/9EVf8RM/93d/+q"
    "u+4zRP8AIv8AEf8zRN0AEcwRIsxVVd2IiO6Imf8RIv93iP+qqv9EVd0iM8xVZt13iO6Zqu5md92qqu67u+6Ime53"
    "d+4AIsxEZv+Zme5mZt2qu/+Zmf8iM/93d92IiP8zVf9VZv+7u//vGcsOAAAAQXRSTlMAEVWZzN3u/7t3M3dm////"
    "/1Ui/4gzIv9E//////////////////////////////////////////+q////////ZubhG7oAAAOuSURBVHjazZl/"
    "e5owEMdZqxxrl+Q6ammro4FQtQsq6ja3dVv3/l/VngQoEqKd7gfcX158xA+5+15yieOY9urktNd3oQ1z+97p6zPn"
    "BTvxoHXzzvcAvukDAKGMMWzFGGOUAED/Ygfg2x6AT1ui2+KkPoBnjfe5Cz7FTpiCfNMkPAUgDDtijAI0MvISgGKH"
    "jAJcGkIBn2GnjPn1WJ8BdIwQkQEMKsIrFwLsnAXgXj0jet3KwyofvZLwGnzspPlwXSD2mmFmN7fD0Wj47uZvJlcY"
    "huzAUPdywovmJNI7zjmPoii6M1MgFtqS+H58oMKoECI4dBovikw0fziZ8sKiaDqxIiqL2b9GDIpsbBScCed8+vA+"
    "yBn5xESMpZSpYpwdFuj5fM4OLjxWsVDO+VC9bjGTU2ogLvSvMyEE/T+CuTQrzh3nQ/2hjPWdDRGZEGKJOJNypVwp"
    "JUUcS0nCWZrEazVW95iUsjGIuJBpItfFl826c6lTsT77wPk02ELkEQcbIiZChNoPC48iZkKM80Sdo+mpd2oM4of8"
    "8wchEmukPV1y6ogPnN/iNiKPHmyIyzz7G4hJMstSIZLA9CrErUH1lNliHX/chajKTt9AHHJ+YyB+qiPOwzAMN6kQ"
    "GdoQKSJL9IvUvS3EajDOn8LiXYh9Lej66IhzaiCO7EXnntkQtcylDmPdqxCrQVpqbmNHRHAdx3GbiMFvIcYEbYhq"
    "UvBzibjlVYjVYFiSrfYhWgL93kAc1hFn8/k8U6gLG6IWQVYibnkVYjW4FCLVjyX7Am3K5ZbzB6wr+tYml40Q8R8j"
    "roQQ+u8X++TyxUD8yvkjqyPe2BCDZ0UvCu8IRCWacZGZiXUF/GIp3ezRKN0lsVkXhRAE8V6Ib4i4Pg5R63vNqFqq"
    "EmvpVl3WwFwASX0BjDixri6Y6hCrh2eLLDkSkaWF9uyIft4cuOY24vsL24jF86cNIk3yv5DHISLTbzezy4VpQatk"
    "3LkZi7htM1YgyjyNVmoeYnosIiJbjonSTborFa19Qbml5fzHb2xm6Or49vFzmpTAsz2dgWfp/8jkafT4NCH/ere1"
    "EbrOKkGvdu5otWDa66KzYq1Kl7ZJPKuaVNIaIqq9YyrXlkkiRSYWrX4HG2m63eo7g84fmDjOzy4eO/00D+/8TsU6"
    "AHjdOOeGNjVjOV48aR7TXnfnIJn54A6sx/FeJ47jkRGA01e7bl16AOATGrR0q8EYC4i6L3i75+bluv2rod754IX7"
    "q5Yv2M6vTKBf+Zbi224ORiEAAAAASUVORK5CYII="
)

_SHAPE_running = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAMAAAC+oj0CAAAADFBMVEUAAAAAAP8AAP8AAP9U2JTaAAAABHRSTlMA"
    "Var/oA4xLwAAAFxJREFUeNp9kUsOACEIQ/u5/52NRhgwYbp8gWIrcEXJlogm+UoF0kVslMTDYzfm01eoWGGBho8N"
    "83zDyiOuLunxYc94MBnw8MAMCbeYfMPzt6qh2Okb9gJ3kTG5AGV3Aq98vaSDAAAAAElFTkSuQmCC"
)

_PILL_finished = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAKYAAAAsCAMAAADYfTP7AAAAvVBMVEUAAACq/8yq/8yq/8yq/8yq/8yq/8yq/8yq"
    "/8y7/93M/93d/+7u/+7M/+6q/8yq/92q/8yq/8yq/92q/8yq/8yq3bt3u5lVqnciiFW77t3M7t1EmXcRiESZzLsR"
    "ZjPd7u5mmXdmqohEiGYzd1W73cyZzKoRiFWIzKoRZkR3qpmqzLsziFWIu6qZu6oid1VVmXeIu5kziGYid0REmWbd"
    "7t13qoiq3cwRd0RVqohEqneq/8wzmWa77syq/92q/90640mHAAAAP3RSTlMAM3eZu93u/1X//////8z/ZogiIkT/"
    "////////////////////////////////////////////////qv//ETN2pWa6AAADw0lEQVR42tWZe3OiMBDAq0W2"
    "mqh9QTXKWihWOHug9Pqy137/j3WTBBWToC1zM9L9Q4co5Me+spucnGjSaJ5aLRuOInbLOm02Tg5K0zoS4A6s1dwL"
    "edYCgHaHEELoUYTP3G0DQOusFLLRA+h3jgS4A9vpA1gltj/nkLQm0gGAc6NXArQJrY2QNoDBQy8AurRW0gG4MFic"
    "0JoJ0ezeqCGl4NyJo0u7bhaX0gX7qoBpQZvWUtpgbSmvoU9rKn243mD2dJMTx70ZDG5c54DLDh2HfW2wqtl7myVS"
    "VyYbjXMZqRN6uJUJvUX0tWcbBj3E4CDTHWKoq/Ns45nq4jO9H2/kfnpUzO7GO7VkNBvvyEydMApyIdSL41/adIbB"
    "ypgEYB1ASpiz+13Me6ZMOP++j1XGpO08iC5Um4/GiozKMR+C4DelJAh8EgdRkrLtIJ0sllmUPLokx2T+PEp8abk/"
    "iyCL5k+5Ap7TJApcYsTs5Eumpdg8HGsSlmL6iDGlE8QgFd6aTbaDd7kHLyfyrkxcCaWGifwpEs4xlRcjI+baOXsK"
    "5kzHnB3GzHDuByhjRw76iC++FyeIt3ngBT4n9yidJIjzBy9FjBilLEKMUvGbAZPkKamlYL7qmK/mEHILmJyFxvIV"
    "5OASkZveQYwkJveOpXgRF3GZv2QqPjPGPacEs5UH+u74QMccmBNSWsQcclsKpHxwjuiKhcJxCL8r43cvhNWXiCLN"
    "McQXETkulXcbMW2BaSvarIhJ5LS4wXzibuk/hDuRPhXfEaIfc0FExq+exZ+ifZiq0d90zLfDvokifouYRAYVBmEB"
    "U3yTwgqBIRGsXJJ9RldDyNUx3SqYlLI4FXHhKZhbbcZxzCge0KYMoZVSeHg6plcFc8L4nCxFTFTMO8TCMpUgLnJP"
    "NSaklTG9k3eV8p1UwAzFmi8DgyiYfn7lRklAaYp4R+RtxvTezBsMpUAaqphDWkWbGWI6Ic8cQtUmz5Spw/Mm/6OD"
    "IovemvNmf91o2N8tPb6GGUbrKHlQMbfpIlirERGTubH0sPMKaaVVxbNC8THwaDVM4ZacxKEaJg0f+UtkC6kgl6+j"
    "SxYYC7lVeY+xpyz+VmvIwr9l5T8ZhoVHMyc82GVYhr6STf3B4HX6v5qF6k2GVfMuXe/Ua9wArwp9+pUNnTpSdna3"
    "E37I5sxP2eoS25s120bqGjc4z6Be/tkGMO6/N2zo18bwpA92yeb7x2ld9rX5jvbpR/lZhsUPXLpHO2/ZHrhYV3tP"
    "hj6bveMfX/Wan4cP2q6OfRh4qTP9A/gBkLKwIK7OAAAAAElFTkSuQmCC"
)

_SHAPE_finished = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAMAAAC+oj0CAAAAD1BMVEUAAAAAqlUAqlUAqlUAVVVTCAHUAAAABXRS"
    "TlMAVar//1RxM2gAAABPSURBVHjafZFRDsAwCEIFev8zL+2WTGvp+3wxRCViAVIiEQXqg0lCCRzt70fVY8st+VAD"
    "XrPrmaIDXpsQo80m5pw+juurzGNdDW9rUursAT2uA5N/jZkHAAAAAElFTkSuQmCC"
)

_PILL_failed = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAIoAAAAsCAMAAACNHNClAAAArlBMVEUAAADuzLvuzLv/zLv/zLv/zLv/zLv/zLv/"
    "zLvuzLv/zMz/3d3/7u7/7t3/zLv/zLv/zLv/3cz/zLv/zMzuzLv/zLv/zLvMmZndzMzdu7vu3d3uzLuqRESIRESZ"
    "VVW7iIjdqqqqd2b/zLuqZmbMqpnuzMz/zMzuzLuZVUSZRES7d3eqd3fdu6q7mZm7mYjMqqqZZlXuzLvuzLvuzMzd"
    "zLv/zMz/zLvuzLv/u7v/zLtQr59LAAAAOnRSTlMAM3eZu93u/3dV/////zPMZv+IIu4iRP/////M////////Vf//"
    "/0SI////////////3aoz/zOqIhERmOR5FwAAAwJJREFUeNrNmH17mjAQwGlFz0LUrrWNQQ+0GZvoOrp2dtv3/2J7"
    "LgmWl4CPOmH3FyEBftxbLuc4Jbm67rn9AVxQBn23d33lHJBr96IQBSB32ABy0wcAz2eXl5HvAUD/pgZkPGmJwwjR"
    "uGMbyW27IBnMbZVkCNAyCMkngIrH3HVCwpgPcFe2jjdinYjvFW10BdARCWMjgFyOuZ92Y53MRtOHPYrbJQmxuBnJ"
    "I3isU/Hg0aBM7Erh/Oh3zoQITlLL3KR7u1L4YmFlCfBDRGkuVLcixPq/WCKuLGp5avAUvljYWS6BknkLQB2JlYVQ"
    "pJFZae4z5/EpKAyASL7Y7GNIbCyE0mz6E1C043612GdPYmEpoyxXIa6lXhZJmddKHMlkLbnxZC6TcBPbUXyV/i2u"
    "kiOpspRQtsZtQhrIgq98S8wUsQRSXSdRDQo5yxwaSSosRZRnervgCeL3MkqMiJtlKhFftNVQRgrcgsJUOP+AZpIy"
    "S85ttypmUkooWi0FlC1iZFSVqqcivdCO0rcEUIWkxJIL5pAxIXRAJ4hBEcVHdYuxFHHLBGKSGdSKMnAcZ3AWChki"
    "jVYhIsZFlBliwkkiWsgRpX59A0r/BAPlAyjMwEooIpcKE7q3YUZHtQaaVEqVY9yWI+JLlMZhvVZIDmnFh4njOK/n"
    "BDMNyG1ZVStF5BRxrS42NSivqqo9I8Vl3piWUJ515KiHZRLyPXOQ1KBQtf12TuKP9RfEGhF5YFA44osIKMUjF5RX"
    "8KcCw0ikIdYk/h1tQtPjt8OPkTSO+az2aY2iHDbVWU1PErRJvXYDwVTtzO/HFwm5kWIJBeWLDIUtpbaG0ghKnXni"
    "FYUSn9mLhPemerKudLJUbrP62TgO8kuDAxWl+88KyrPr7Lfuy+zxx+HD65bkdX8Oeuj6SParcFD1uyOB8f95fO+q"
    "vaJ0UmmwPHXC4oM5jBWbpNPWjeR7MLU24373oFWYkQfQ+1PTo9y5AJ7nt4Az8j3qTz40dG53w3lbLeT5cHeooX3f"
    "TmP9vvrlv77LPISJtocqAAAAAElFTkSuQmCC"
)

_SHAPE_failed = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAMAAAC+oj0CAAAACVBMVEUAAACqVVWqVVU/5rC/AAAAA3RSTlMAqv+D"
    "nH8wAAAARUlEQVR42nXRuQ0AMAgEQaD/oi3ZGPEt4QR8J/JLVZZSM1118avDXZuHFk+avGh4U/ehz4GhCY2kBekc"
    "Op5eRY+lGFpoB2rLAZHOIxe7AAAAAElFTkSuQmCC"
)

_PILL_capped = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAJwAAAAsCAMAAACnrCEKAAAAvVBMVEUAAAD/7pn/7pn/7pn/7pn/7pn/7pn/7pn/"
    "7pn/7qr/7sz//93/7pn/7rv/7pn/7pn/7pn/7pn/7t3MzKq7u4i7qnfMu5nu3bvd3arMu4h3ZiJmVQDu7syqmTOZ"
    "iFWZiETdzJmZdwCIZiKqqnfMzJm7qoiIdzOqiCKqmVXdzIh3ZhGId0R3VRFmVRGqmWaZd0Tu7t3d3bvdzKqqiBHM"
    "u3fu3cyZdxGqmXfdzLvMqmb/7pm7qlW7mUTu3ar/7pnt7qtnAAAAP3RSTlMAM3eZu93u/1X////M/2aIIkT/////"
    "////////////////////////////////////////////////qv///xEwNiB/AAAEAklEQVR42s2Ze1ebMBTAaaXE"
    "kjo1CqxcpMJo7HhJszE29/j+H2snD/qAoGceXbl/EULCj5v7SC6G0ZHJ9MycWeg/izUzz6YT41mZmv8d6wjRnA6i"
    "nc8QQnPbxicR254jhGbnWrTJAiF0gU8qFwghU7O6H06P1uJ96FnbKNAUXsfyLhGyMR4N3WVnTUfDhrF9tLKTUbEJ"
    "up1XXFnjYuN01pWCM8fiC4d2Z0q2azTHoxOErgXc4p8XldzcOq73zgu7EElrQHEfPw4NXPrAxXffhiMAgP7dOToX"
    "FqdX3N3dgNpCaGX1jnC2sDqEtEPuo+he28HZ4k/JmgKA835wGKFhd3iIogfd/QQANuJqAwDB+8HN0bVxqY8jn6Mo"
    "ij5rOigAVeubKtW5mQ957BChV0qDZJUWVDQJpSvs0CLNlH0GDs0LWipnWtI8XbkDcBfocsDkyAOHeyDaz0zUdZn7"
    "JcbkUVmgz5+OAUrZpATjCiBXJlryEVvpSlAkrepBPo/1RrdAROeQkZBlr8MFgOMBJUBRuk4u3x8LRyljaZAVb6Xh"
    "JgUAhnHlA9C1GwIUnpzKL8MchuAWxkznD+SLhPvSA78F8I/v+AD8GxhAquC20m1yCecHGFexcG1HmUQJEEoDIRgH"
    "vh6OoJneWb9GSr52e5ydybXCGBOfUABUAm7TLj8TcO5e4VS1ak4un8AYr/VwGFmGpYELvrVw37ruuOxpjpvSssxS"
    "qbJY6lEo9FbA1S1rzfk3DRfu56xl+j4MN9PY3I9oJz86XTcHMwXbmo91/TYoS7ib1qsdASen570EDmSbSDsQehxa"
    "Vk1mDaIDCZ7xVoBYLDT4m6WXvqw5aDXXNE39kua4Qzz14X4ewv3sdGadOMdfy3HITnMiaFQ7m0va0E04cLKbqFau"
    "M2RzNnrSBGEvOhKvnyHCVnHgcS8tlBsruLySjgNEwGW891F8UqlaTuFnQrehMgB9EJ4ak176+nUM9+uZ3Fpi7HHN"
    "Ecx4uHICEUr8tVvKThHnsqX7KDVYFwAh43EOPsmPW7lLCkPpa2L03PV31JHfz+9KYtgHepe36D5hcDjVDNuIIiQj"
    "GBM1MhxI/JZh9IzurgvX2zq5mZg0lfnSE+/wb/BKwTGRv2itLI+sBIF0WiZyXSrzcBXKnoEt09Mrd+lBcrgTZoyx"
    "9prD4bq9UYn3bhnbP0w8tg8AZMvqgVfM5T7dfMuzV6zCPj6Ae9023WxPreOD251czTc8fq2b5mChSNM0r5pmLixO"
    "HapHdnC92B+qR12OGHchR5Tn7BGxdQp052MqHvbqwhMLzUegPHuOLE1R+M8ZOjkeL6if/dHX001etD5tqd+8GvwT"
    "MZkuTvmTZPHST5yr0/1e6intL2/xY9+CrljXAAAAAElFTkSuQmCC"
)

_SHAPE_capped = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAMAAAC+oj0CAAAADFBMVEUAAACqVQCqVQCqVQAC8sHSAAAABHRSTlMA"
    "Var/oA4xLwAAAEZJREFUeNqVzkEKgEAMBMGk5/9/FoToujaIc2zqMFWf69YMihPjJCg2nnOK3zwxzmQUPzl3RvHK"
    "WTPbuVkbvviGh7Nn6t8OPCEBzfPsbVAAAAAASUVORK5CYII="
)

_PILL_rejected = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAKwAAAAsCAMAAADPX6MyAAAAnFBMVEUAAADMzN3MzN3MzN3MzN3MzN3MzN3MzN3M"
    "zN3d3d3d7u7u7u7M3d3MzN3M3d3d3e7MzN3M3d3MzN3M3d3d3d3M3d3M3d3MzMy7u7tERFVVVWZ3d3eIiJlVVVVE"
    "VVWqqqqqu7uqqrtmZmZmd3eZmaqZmZmIiIhmZnd3iIhVZmaImZmZqqq7u8x3d4jMzN3M3d3M3d3M3d3d3d3MzN0t"
    "7B7TAAAANHRSTlMAM3eZu93u/1X///8zzP//ZneIiCIiRP//////////////////////////////qmZVEREicNbb"
    "WAAAA79JREFUeNrVmWtX4jAQhgFLxxAu4q62QxqqlbTghXXX///f9uRW0zaVA+IxzicIQ/t0+s5MLoNBx4aji2gc"
    "wzdaPI4uRsPBQRtF34rZQI5GH6JejgGATGgANiEAML7sRZ3OAOYLGowt5gDR1M96BTCf0KBsMge48qoVgNDgjAAs"
    "u6zXADREmwD86mpgTgO1eVsJ00DjqgygUXN/xwGzUgrxjQMbhZhbbpZF76y3YbNK2tsadnZGESRJ8hVCmNVN9qjA"
    "pqhtxTLfM3LEz9ESxLUntJe1YtuNK2c1PmF3flhp96fAEsbYsbC0Vm2nbOVFYWkJK4q8DcsZYw9c0nZjuxGCHAwd"
    "Px4W+tKLFZaWqI9t2EKrkyOWp73n42Ftil3DovOiDC15x+7CUoH4YFTDeWUCumXmMUXFObMvJSkLzqtcXbtCRMZY"
    "0nFKGV+x1A+7ME03Ao+sFKSP1YHNEWXQyU4LmKdycKU1m3I9WBDzWMp2RAZOW9p2KvUX4YW1ovUVLo3pY3VgGeIj"
    "pXSHWORpichJDZusEcs0f9C+OSJWgnH5jYgMkQup7KaTTNxdVkr+dX/xGgPtofWxKthEmsF7QqxM9MoaliEKOVip"
    "isH1N8JVPGvNNp0KLSqy6oEd+4uBQ9tldUsXf9a3Sp280bBrRPXPe8QX+mzpMl48ObANpwWampf3wMYK1j+JIS8S"
    "9uVD2NwU1lJIQ3VvBZsgrtVYKV+x0Xa7GjSdEkSkdrgf9ngZrOQttlxrzekRMjQK9tkZ41Ygbdimk7zsB6XLyuDk"
    "BCuUANaImTDmRJbbsQ3d9EbWcToYWZ1g+1NLV4aYWeTaFCyxd657nqnHsqZa2KYTOaTZ/eeawgZxq6qAituG71id"
    "YJURNOOFUMFP319F/Z6bTisjlqqng43Mkua0dmsSRxakMpF1VhUiDSuz8CnJmQ5XJn9LE2b+KTtYmkxaTjJBt+kd"
    "wx5Ys7SJj53IFI1PdXlgTgd7tIPCVFRt6k5b28GaToX+XPonMrGZde2PnSIa2MRmClvL+W1OHVh6X6lGauQsVEs2"
    "VyXMwLacVPcq6doLuz/fqoYk9hK20qtFgzsTSUjPysJF6nFy1zXd2feJlrOdP5c/vayJnF2DM+1wZHVfO/c+x/D8"
    "S/FUCPEF60VSK1baTQwBbXV2J96NTY7B8AdtHw0Gf37QxtxgsAw1tgCeo4XXUDeTX71HCnF4tATiniOmvxeBBZcA"
    "XPzrP6+JAOaB8BJ5VvP24UnYdDkL5dBuNpoePmR8W4ZwHLq86ZL9BwvMa9EvgTKtAAAAAElFTkSuQmCC"
)

_SHAPE_rejected = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAMAAAC6V+0/AAAADFBMVEUAAABVVVVVVVVVVVWH3s5DAAAABHRSTlMA"
    "Vf+qfMM9RQAAAElJREFUeNqVkFsKACAIBGu8/52DMnstVP7oDqKrKf1EZtTklg2CglMIqsqJhViYy40NutpSrPrC"
    "VKMeeSzXNq+37Q+xbud83WMU2ZMBC+PZ23gAAAAASUVORK5CYII="
)

_PILL_interrupted = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAMYAAAAsCAMAAAAJmjeLAAAAmVBMVEUAAAD/7pn/7pn/7pn/7pn/7pn/7pn/7pn/"
    "7pn/7qr/7sz//93/7pn/7rv/7pn/7pn/7pn/7pn/7t3u7sxmVQDMu5mId0SZdwDu3cyIdzOZiESqmWbu3bt3VRG7"
    "qojdzKrMu4iqmVWIZiJ3ZiKZiFXMzJm7qndmVRF3ZhHd3bu7u4ju7t2qmXeZmVWZd0TdzLvMzKr/7pn/7pl9wtAH"
    "AAAAM3RSTlMAM3eZu93u/1X////M/2aIIkT/////////////////////////////////////////qhEj/wWlAAAD"
    "v0lEQVR42t2aa3fiIBCGvcRgMtpaMnHFaFFjYqzZtvb//7g9EKK5EK/dU+l8Qg6OPDAvt7HVqli707V6NnlQs3tW"
    "t9NunbGO9bAAJRircwKi3yOEOK4LD22u6xBCev0GiPaAEDIEI2xICLG0sfVkDkQO8qRRhVEQCqSmkGdCXADjOJ5r"
    "EWUcBYBbiau2kRSSo6DzkW0mheCwRwcMyzR1F/Vh5RQvxAFjjZAXhTG4KqQopY8VVgN1BLlqMjxE/CkOH3Fcq3RI"
    "XymjOhl/hJUK5zAmjE2/o5+MBddiuEodhMDdGDPE+TdgvCJOr8UAQhoEbhaGI0X+XF9tL8DgjC285QrDgMqQQkTG"
    "GAcAvg4xnPqy8ZoxGi1ZdCxwFTY+YzEAFbEYs00y9mVdiDhnjNGKG6Ax24TrrR5jKI8kdWlcguEjBgkKGwNsUVkE"
    "EKjiWPRlhRgj4tux4CMy4SZGXAPsEOfrrH0g5yIzWnGzY6qNFiMTx4DQ2zDmOA5Wsu9eukTENE1nsiuBHyeIfzOM"
    "EBMWHQs1DMRkvRQDwoGn74hhmqa04kZ4Z8FUDZp+ye3VFH4hBi4AgMlxPGiDbkR/ALwN4kRiJB8AhUIdI/QAdqtM"
    "FLk2ym522WQB12NQ0tMuVBdiJKo74wLGJ2KYqQIxlr1/BYXxCnoMX1ULrzlG2Y2YeRkxUy0GELvVatm3YrBCt3KM"
    "OIuKNGWIS9n7zxzjswFjknudHDHKbmL1nXzMtBi9W7Whw8iVKWwqe89zDN6Akf06Im6PGGU3gWwLAIsTQTW4daU6"
    "ORtpmi4uwzg5G9LNmdnIJL7/Toy8WlkdI0JcQbb4KIxIVRe1UXbzlmtj3YCxv3n7q2BMVHTsUC0xyTyMdBhbxI0H"
    "QMMDhuzYe+ZmobyW3UzUquhhw/bXkRdY534MKoI44p4Y5bnP4xBxQ3UYouFq8Sb2s3zfGC/8dzUrYkkNOIeKG9E6"
    "iF4TbDiMyIusTe7HgKnaxSkr7OgajFy9wQFDfUGKmCZqFy+7mW1UG/3R0JYn3P0tB/UqhsfUb9IglOvLVq+NjGMe"
    "b48rlRyBdbZg8VAdRkpuYDsWH2KuP6jv/88d1uOzUxcr+jHJiwIDYMv57Jwbyrmnd+fkt1jrx95FMow7L7HW8ZXK"
    "XIzCS5X1U08jNE3T+zw4Shnquc3Qh6ph8bntlzx+/panaJnecA2kqCU4+iamaTT5v7ZNHIMmxHWIrU3+fXWJMSAi"
    "Gdv9asrFWiKNaUZC2RqdyIy3OwMT0vuD839UGD3+ny00E/EP1oGg1YYCy8AAAAAASUVORK5CYII="
)

_SHAPE_interrupted = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAABYAAAAUCAMAAAC+oj0CAAAABlBMVEUAAACqVQC2RMhoAAAAAnRSTlMA/1uRIrUA"
    "AAAWSURBVHjaY2AgFTCCAApjVJiWwsQDAJIsAKGhZtIuAAAAAElFTkSuQmCC"
)

_ICON_person = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAcCAMAAABBJv+bAAAASFBMVEUAAACIiIh3iIh3iIiIiIh3iIh3iIh3iIiI"
    "iIh3iIh3iIh3iIiIiIh3iJmIiIh3iIiIiIiIiIh3iIh3iIh3iIiIiJl3iIh3iIinnRlZAAAAGHRSTlMAM3eqd4j/"
    "zGbuZt0RESJVVUREEZkRuzPFskqCAAAAvElEQVR42q2S2w6DMAxDoQWXkNILMPb/fzqJrqPQ8ILmFywdKcVOmuZf"
    "apXWXXtHe+xSMtUAjAGgJTqAxvTFIGDOUztwTS0wJed+rpAHZUsIFY5AtkCUhn8Tz8Ai5TLJGDGZJbDyXjFokoJH"
    "Sq3RLNe2aAJIT/dLce7RLu1qOL/NZrVnqr4oK22nqIz7McRdYez5VNyLsZ2nbeCjuQBc/tgB/ni53jAVNyFgLk5O"
    "5W0cMgW267u66Wv0R/oAW28Gu4ukWvYAAAAASUVORK5CYII="
)

_ICON_clock = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAcCAMAAABBJv+bAAAAS1BMVEUAAAB3iIiIiIh3iIh3iIh3iIh3iIh3iIh3"
    "iIiIiIh3iIh3iIh3iIh3iIh3iIiIiIiIiIh3iIh3iIh3iIiIiJl3d4iIiIiIiIiIiIjVur1rAAAAGXRSTlMAM3eZ"
    "u3cR3f9m7sxmiCIiM0RVqhEiRBFVACksjQAAAPFJREFUeNqNk8sWgyAMRINBMoVirbS1//+lPbwU1EWzYeAGiWEg"
    "+jfUwFrzqK6YGQQlZDRHeovr1jE7G8W9px6An7J+xMnY0hGQOaGU8pSOL0DIBQCvJAKwbFVZSKkdeGQlsK/9YHXE"
    "CvAF203tmDxsFk/AnPEb+CTBNa/DZMFpdNBXuC67kkZEE+DXohnuiE3suzcdDmWMscaG4p53hZKGpr8TIx+K8tFb"
    "U0/q+zjlKpfaaD7fP2/d4NqBJj77HgPIwR9GYOsf0rde6BYB+HZmkcaBSoDhZKbLSWNF0Z61XFiRaG2MPJgrq8/p"
    "GQwz/R8/XFcJ/aHDlnkAAAAASUVORK5CYII="
)

_ICON_document = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAcCAMAAABBJv+bAAAAQlBMVEUAAAB3iIh3iIh3iIh3iIh3iIh3iIh3iIiI"
    "iIh3iIh3iIh3iIiIiIh3iIh3iIh3iIiIiIiIiIiIiIh3iIiIiIh3iIjiQAsIAAAAFnRSTlMAEVV3maq7iCLd/+4z"
    "zCIzVWZ3RERmFLebigAAAL5JREFUeNqV08sOhCAMBVCUgcqtio/h/391gogWZOHchTE5sRSoSr1I1+uPsUdoeOjg"
    "cIfHmifAGjrCAM+lemDJ77EO+4JXsLrZcOUbnGAaGbwL1phEG6Sii/5JsIWz1kHUK3jJ+/s2WY3n/nSbc4ebYPdk"
    "es9TfFyhBtubbYPn75Xh/7W7PX3q23ytHWrWsXjuPF2WE6cWWmsHwagZWOUw9aX2gC9G8ZzEFIPikmY5yEdcMa1d"
    "OH+CFBPUu/wAqpQMuYZMRmQAAAAASUVORK5CYII="
)

_ICON_layers = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAcCAMAAABBJv+bAAAATlBMVEUAAACIiIh3iIh3iIh3iIh3iIiIiIh3iIh3"
    "iIh3iIiIiIiIiIh3iIh3iIiIiIh3iIh3iIh3d4h3iIh3iIh3iJmIiIh3iIiIiIh3iIiIiJl+ZyupAAAAGnRSTlMA"
    "M6pEu/9EzN1VVWaZZiIiESKI7hERM3d3EQEGRRgAAADpSURBVHjanVNbEoMgDFQk4ItKxaq9/0U7SWAIPjqd8gXu"
    "JtlkY1X9fmql6luw0QAA2lyDFgDaFgCsuQZtV1WdPRN6iuz40bWRWYB9Zg+SMCLoyloOCSNdMVY9SnhS2ANdPYbD"
    "+BQgf/Hx6eeAz0mAYfYi2cKEV8wV5iVjj0yYBTgl5WqlEhsSIGyUdlVROYpkJ/weYE8ggIpjwSa1sKrWYohpTMkq"
    "Mu4wJ5esMjThQQyBiQMKszZHDixdJ/LOyl2qpw+WvLcQWLmwhA2WWggUDn9dh2KZiGmb07ZRR6T8ZlcNL3L9329w"
    "dT7nKAs5xA7TegAAAABJRU5ErkJggg=="
)

_ICON_money = "data:image/png;base64," + (
    "iVBORw0KGgoAAAANSUhEUgAAAB4AAAAcCAMAAABBJv+bAAAAS1BMVEUAAACIiIh3iIh3iIh3iIh3iIh3iIh3iIh3"
    "iIh3iIh3iIh3iJmIiIh3iIh3iIiIiIiIiIiIiIh3iIh3iIiIiIh3iIh3iIiIiIiIiJlQELxAAAAAGXRSTlMAM3eZ"
    "qruIVRHd/xFmzO5EIhFEZlUiM3cR3WDMowAAAPFJREFUeNqlk+GugyAMhVHaYs8GOlC87/+kNzpR5zTZsv6R9Gva"
    "w6Ea83NUtSUmK645gU6xBt2O9D7n1WuYv0fM8G03nx6VAPGAFbDPXJcU6N/xPr7GYsxtyNXQGHOBS5xhLXYM9I79"
    "NNEzM+syOw/X0uxUHjb3FNJEl+oxxWzWKs1r8xdp8GPrBEBXMJdZTQ/Yp0iF36SxiAhxQEmaDLQn0u7bS8mCWcQS"
    "M1kLVAUL+OjaY/eeBFpm0yo8bKWKcekCldjGJBS2+6Ry+uMXbX7O9rs+TlgDgnpOcVpHmYzVs6012S/WNxdL74Rs"
    "XX32g/wDgDIOrJuuDAsAAAAASUVORK5CYII="
)

PILLS: Mapping[str, str] = MappingProxyType(
    {
        "queued": _PILL_queued,
        "running": _PILL_running,
        "finished": _PILL_finished,
        "failed": _PILL_failed,
        "capped": _PILL_capped,
        "rejected": _PILL_rejected,
        "interrupted": _PILL_interrupted,
    }
)

SHAPES: Mapping[str, str] = MappingProxyType(
    {
        "queued": _SHAPE_queued,
        "running": _SHAPE_running,
        "finished": _SHAPE_finished,
        "failed": _SHAPE_failed,
        "capped": _SHAPE_capped,
        "rejected": _SHAPE_rejected,
        "interrupted": _SHAPE_interrupted,
    }
)

ICONS: Mapping[str, str] = MappingProxyType(
    {
        "person": _ICON_person,
        "clock": _ICON_clock,
        "document": _ICON_document,
        "layers": _ICON_layers,
        "money": _ICON_money,
    }
)
