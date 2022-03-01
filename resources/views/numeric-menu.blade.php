<?php /** @var \Illuminate\View\ComponentAttributeBag $attributes */ ?>

<ul {{ $attributes }}>
	<template x-for="item in items" :key="item.value">
		<li>
			<label>
				<input 
					type="radio"
					:value="item.value"
					:checked="item.isRefined"
					@change="refine($event.target.value)"
				/>
				<span x-text="item.label"></span>
			</label>
		</li>
	</template>
</ul>

