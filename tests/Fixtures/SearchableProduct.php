<?php

namespace InterNACHI\BladeInstantSearch\Tests\Fixtures;

use Illuminate\Database\Eloquent\Model;

class SearchableProduct extends Model
{
	public function searchableAs(): string
	{
		return 'products_index';
	}
}
