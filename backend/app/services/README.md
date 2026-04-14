# Services Files

## Structure
```{bash}
services/
|-- __init__.py # Module init
|-- core.py # Contains the definition of the ServiceWorkerManager
|-- service/
|   |-- main.py # Primary service file where ServiceWorkerManager is created
|   |-- other # Any other files used by the service
|__
```

## Core Service
The ```core.py``` file defines the ```ServiceWorkerManager``` class which is used in the service ```main.py``` files to handle incoming jobs.

## Services
Any service must implement a ```main.py``` where the ```ServiceWorkerManager``` is defined. This object contains the ```JobStore``` and ```EventBus``` insances, the service name, a ```ProcessPoolExecutor``` for running workers, and a reference to the processing function the file will use. For a reference on what ```main.py``` should contain for a new service just reference one of the existing services.
