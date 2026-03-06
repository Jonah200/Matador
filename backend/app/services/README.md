# Services Files

## Structure
```{bash}
services/
|-- __init__.py # Module init
|-- core.py # Core service
|-- service.py # Other service files
|__
```
## Module Init
The module ```__init__.py``` file imports all of the service files that are defined by a service file and that should be registered for running. Any service defined in a file not imported in this file will not be run as a side effect of python's module loading system.

## Core Service
The ```core.py``` file defines the ```AnalysisService``` base class. All services must extend this class, and be marked with the ```@register_service``` decorator. This will add them to the ```REGISTERED_SERVICE``` array, which the ```run_all_services``` function uses to startup services.

## Other Service Files
Any other service files that are to be run as a part of the analysis pipeline must be implemented as a class that extends ```AnalysisService``` class in ```core.py```. Analysis Services should specify the ```service_name: str``` and ```service_scope: ServiceScope``` fields, as well as implement the ```run(self, text: str) -> dict``` function. 
