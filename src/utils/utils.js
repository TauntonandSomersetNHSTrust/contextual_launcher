module.exports.getDateDiffInString = function (a, b) {
	let mills = Math.abs(a - b);
	let hours = 0, minutes = 0, seconds = 0;
	while(mills > 3600000) {
		hours++;
		mills -= 3600000;
	}

	while(mills > 60000) {
		minutes++;
		mills -= 60000;
	}

	while(mills > 1000) {
		seconds++;
		mills -= 1000;
	}

	return `${hours}:${minutes}:${seconds}.${mills}ms`;
}
