var app = angular.module('bestsellersApp', ['ngAnimate']);

app.factory('booksService', function ($http) {
	return {
		getBooks: function (offset, category, onSuccess, onError) {
			$http.get('/get_books/', {
					params: {
						'offset': offset,
						'category': category
					}
				}).success(onSuccess)
				.error(onError);
		}
	};
});

app.factory('extractsService', function ($http) {
	return {
		getExtract: function (title, onSuccess, onError) {
			$http.get('http://extracts.panmacmillan.com/getextracts?titlecontains=' + title)
				.success(onSuccess);
		}
	};
});

app.factory('displayedBooksService', function () {
	return {
		removeDisplayed: function (newBooks, displayedBooks) {
			var removedBooks = 0;
			if (newBooks == false) {
				return removedBooks;
			}
			for (var i = 0; i < newBooks.length; i++) {
				for (var j = 0; j < displayedBooks.length; j++) {
					if (newBooks[i] && newBooks[i].title === displayedBooks[j]) {
						newBooks.splice(i, 1);
						removedBooks++;
					}
				}
			}
			return removedBooks;
		}
	};
});

app.controller('mainCtrl', function ($scope, $http, $sce, booksService, displayedBooksService) {
	var offsetCount = 0;
	var resultsCount = 0;
	var bookIndex = 0;
	var books = [];
	var displayedBooks = [];
	var suggestions = [];
	var nexts = [];

	$scope.loading = true;
	$scope.animateTrigger = 0;

	function onError(data, status, headers, config) {
		$scope.loading = false;
		$scope.isError = true;
		$scope.errorStatus = status;
	}

	function onLoaded(data) {
		$scope.isListEmpty = data.num_results === 0;

		if (data.num_results > 0) {
			var removedBooksCount = displayedBooksService.removeDisplayed(data.results.books,
				displayedBooks);
			resultsCount = data.num_results - removedBooksCount;

			if (resultsCount <= 0) {
				offsetCount++;
				$scope.loading = true;
				booksService.getBooks(offsetCount, data.selected_category, onLoaded,
					onError);
				return;
			} else {
				$scope.displayedCategoryEncoded = data.selected_category;
				$scope.displayedCategoryName = data.results.display_name;
				books = data.results.books;
				suggestions = data.suggestions;
				nexts = data.nexts;
				$scope.book = books[bookIndex];
				displayedBooks.push($scope.book.title);
				loadRandomText();

				if (data.categories.length > 0) {
					var middle = Math.ceil(data.categories.length / 2);
					$scope.categoriesLeft = data.categories.slice(0, middle - 1);
					$scope.categoriesRight = data.categories.slice(middle);
				}

				$scope.triggerNext = function () {
					$scope.animateTrigger++;
				};

				$scope.nextBook = function () {
					if (bookIndex === resultsCount - 1) {
						$scope.loading = true;
						bookIndex = 0;
						offsetCount++;
						booksService.getBooks(offsetCount, $scope.displayedCategoryEncoded,
							onLoaded, onError);
					} else {
						bookIndex++;
						$scope.book = books[bookIndex];
						loadRandomText();
						if (displayedBooks.indexOf($scope.book.title) < 0) {
							displayedBooks.push($scope.book.title);
						}
					}
				};
			}
		}
		$scope.loading = false;
	}

	function loadRandomText() {
		$scope.suggestion = suggestions[getRandomInt(0, suggestions.length - 1)];
		$scope.next = nexts[getRandomInt(0, nexts.length - 1)];
	}

	$scope.reloadBooks = function (category) {
		$scope.loading = true;
		bookIndex = 0;
		offsetCount = 0;
		booksService.getBooks(offsetCount, category, onLoaded, onError);
	};

	booksService.getBooks(offsetCount, '', onLoaded, onError);
});

app.directive('onBookChange', function ($animate, $timeout) {
	return function (scope, elem, attr) {
		scope.$watch(attr.onBookChange, function (newVal, oldVal) {
			if (newVal != oldVal) {
				$animate.addClass(elem, 'slide-out', function () {
					$timeout(function () {
						scope.nextBook();
						$animate.removeClass(elem, 'slide-out');
						$animate.addClass(elem, 'slide-in');
					});
				});
			}
		});
	};
});

function replaceAll(find, replace, str) {
	return str.replace(new RegExp(find, 'g'), replace);
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
