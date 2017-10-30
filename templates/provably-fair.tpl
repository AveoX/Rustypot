{extends "main.tpl"}

{block "title"}
  Provably Fair
{/block}

{block "content"}
	<div class="panel panel-default">
        <div class="panel-heading">
           Provably Fair
        </div>
        <div class="panel-body">
          <h1>Provably Fair:</h1>
				  <br>
            <p>
				At the beginning of a round a "Secret"(Salt) is randomly created, and a SHA-1 Hash gets generated out of it and shared publicly. Other than similar services, the winning ticket is generated at the end of a round, with unpredictable values.
				As soon as a round is closed an MD5 Hash is generated with the total value of the round (eg. 123.10) and the Salt that was generated in the beginning.<br><br>
				As an example, the MD5 hash of <b>123.10-04495e619935d08c</b> is <b>4963362068a5aae28c0ab8e7994a0e75</b>. Changing the value or salt the tiniest bit will result in a completely different hash. <b class="text-info">The total value and salt are seperated by a dash(-). The decimal point of the value is always a dot(.) and not a comma. The total value always has two decimal places.</b><br><br>
				After generating the MD5 hash the first 8 characters of it are converted from hexadecimal to decimal (32 bit integer), and divided by <b>4294967296</b> (Maximum value of a 32 bit integer). This will result in a Decimal number between 0 and 1 which is the winnerticket.
				We do not provice an automated Provably-fair calculator for reputeability reasons.
				Required calculators can be found with Google searches:
				<a href="https://www.google.de/search?q=sha1+calculator" target="_blank" class="btn btn-xs btn-info">Search SHA1 Calculator on Google</a>
				<a href="https://www.google.de/search?q=md5+calculator" target="_blank" class="btn btn-xs btn-info">Search MD5 Calculator on Google</a>
				<a href="https://www.google.de/search?q=hexadecimal+to+decimal+online" target="_blank" class="btn btn-xs btn-info">Search Hexadecimal to Decimal Calculator on Google</a>
			</p>
        </div>
    </div> 
{/block}