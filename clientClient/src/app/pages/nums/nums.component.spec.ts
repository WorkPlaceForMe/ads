import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NumsComponent } from './nums.component';

describe('NumsComponent', () => {
  let component: NumsComponent;
  let fixture: ComponentFixture<NumsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NumsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NumsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
