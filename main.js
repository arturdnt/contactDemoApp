 angular
     .module('WorkersContactList', [
    'ngResource',
    'jcs-autoValidate',
    'angular-ladda',
    'mgcrea.ngStrap',
    'angularSpinner',
    'infinite-scroll'
])

/*
app's configuration - runs before services etc.
*/
///
.config(['$resourceProvider', function($resourceProvider) {
  
     //https://docs.angularjs.org/api/ngResource/service/$resource
    $resourceProvider.defaults.stripTrailingSlashes = false;
    
   
}])

/*
app's resource factory
https://devdactic.com/improving-rest-with-ngresource/
https://docs.angularjs.org/api/ngResource/service/$resource
*/
.factory('WorkersDetailsServer', ['$resource', function($resource) {
    return $resource('//', {
        id: '@id'
    }, {
        update: {
            method: 'PUT'
        }
    });
}])

/*
Contact Service
*/
.service('ContactService', ['WorkersDetailsServer', '$q',function(WorkersDetailsServer, $q) {

    /* ---- Testing
    WorkersDetailsServer.get(function(data) {

        console.log(data);
    });
    */
    var self = {
        //workers: data,
        workers: [],
        selectedWorker: undefined,
        page: 1,
        hasMore: true, //are there any more records on the server ?
        isLoading: false, // is it in the middle of a loading process ?
        isSaving: false, // is it in the middle of a saving process ?
        isDeleting: false, // is it in the middle of a saving process ?
        searchTerm: undefined,
        ordering: 'email',
        addWorker: function(worker) {
            this.workers.push(worker);
        },
        loadContacts: function() {

            if (self.hasMore && !self.isLoading) {
                //set the isLoading flag to true
                self.isLoading = true;
                //set params to be sent to the server
                var params = {
                    page: self.page,
                    search: self.searchTerm,
                    ordering: self.ordering
                };
                WorkersDetailsServer.get(params, function(data) {
                    //console.log(data);
                    angular.forEach(data.results, function(item) {
                        self.workers.push(new WorkersDetailsServer(item));
                    })
                    if (!data.next) {
                        self.hasMore = false;
                    }
                    //finished loading set the isLoading to false
                    self.isLoading = false;
                });
            }

        },
        loadMore: function() {
            if (self.hasMore && !self.isLoading) {
                self.page++;
                self.loadContacts();
            }
        },
        doSearch: function(searchTerm) {
            //reset all 'pagination and containers' vars 
            self.page = 1;
            self.hasMore = true;
            self.workers = [];
            self.searchTerm = searchTerm;
            self.loadContacts();
        },
        doOrder: function(orderingTerm) {
            //reset all 'pagination and containers' vars 
            self.page = 1;
            self.hasMore = true;
            self.workers = [];
            self.ordering = orderingTerm;
            self.loadContacts();
        },
        updateContact: function(worker) {
            self.isSaving = true;
            //reset all 'pagination and containers' vars 
            // WorkersDetailsFromServer.update(worker).$promise.then(function(){
            //... because workers array contains new WorkersDetailsFromServer reasource with the item/worker we attached the resource functionality to that object. So now we can do:
            worker.$update().then(function() {
                self.isSaving = false;
            });
        },
        deleteContact: function(worker) {
            self.isDeleting = true;
            worker.$remove().then(function() {
                self.isDeleting = false;
                self.workers.splice(self.workers.indexOf(worker), 1);
                self.selectedWorker = null;
            });
        },
        createContact: function(worker) {

            var d = $q.defer();
            self.isSaving = true;
            WorkersDetailsServer.save(worker).$promise.then(function() {
                self.isSaving = false;
                self.page = 1;
                self.selectedWorker = null;
                self.hasMore = true;
                self.workers = [];
                self.loadContacts();
                d.resolve();
                
            });
            return d.promise;
        }
    };

    self.loadContacts();
    return self;
}])

/**
    workersListController - controls the List of workers' table
**/

.controller('workersListController', function($scope, $modal, ContactService) {

    $scope.search = '';
    $scope.ordering = 'email';
    $scope.contactSrv = ContactService;
    //$scope.selectedWorker = ContactService.selectedWorker;
    //worker's row click handler
    /*
      $scope.selectworker = function(worker){
          console.log("ContactService: " + ContactService);
          $scope.contactSrv.selectedWorker = worker;
      }
      */

    $scope.showCreateWorkerModal = function() {
        $scope.contactSrv.selectedWorker = null;
        $scope.createModal = $modal({
            scope: $scope,
            template: 'templates/modal.create.tpl.html',
            show: true
        })
    };

    $scope.createNewWorker = function() {
        $scope.contactSrv.createContact($scope.contactSrv.selectedWorker)
            .then(function() {
                $scope.createModal.hide();
            }, function(reason) {
                console.log('Adding has failed: ' + reason);
            });
    }

    $scope.loadMore = function() {
        console.log('Load More');
        $scope.contactSrv.loadMore();
    };

    //add watch to the 'search' and 'order' vars
    $scope.$watch('search', function(newVal, oldVal) {
        if (angular.isDefined(newVal)) {
            $scope.contactSrv.doSearch(newVal);
        }

    });

    $scope.$watch('ordering', function(newVal, oldVal) {
        if (angular.isDefined(newVal)) {
            $scope.contactSrv.doOrder(newVal);
        }

    });
}) //end of workersListController controller's code

/**
    workerDetailsController - controls the 'details box' on the right column
**/
.controller('workerDetailsController', function($scope, ContactService) {
    $scope.contactSrv = ContactService;
    //save
    $scope.save = function() {
        ContactService.updateContact($scope.contactSrv.selectedWorker);
    };
    //update
    $scope.remove = function() {
        ContactService.deleteContact($scope.contactSrv.selectedWorker);
    };


}); //end of workerDetailsController controller's code